""" Adapter for Odin Control to detect and control various keithley 
instruments over a GPIB interface using PyVisa """

from concurrent.futures import thread
from odin_gpib.keithley2410 import K2410 
from odin_gpib.keithley2510 import K2510

import os
import time
import pyvisa
import logging
import warnings
import threading
from concurrent import futures
from contextlib import contextmanager

logging.getLogger('pyvisa').setLevel(logging.ERROR) # Hide debug spam of searching for all gpib boards
logging.getLogger('gpib').setLevel(logging.ERROR) # Hide debug spam of searching for all gpib boards

from tornado.concurrent import run_on_executor
from tornado.escape import json_decode

from odin.adapters.adapter import ApiAdapter, ApiAdapterResponse, request_types, response_types
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
from odin.util import decode_request_body


class GpibAdapter(ApiAdapter):

    def __init__(self, **kwargs):

        super(GpibAdapter, self).__init__(**kwargs)

        background_task_enable = bool(self.options.get('background_task_enable'))
        self.gpibmanager = GpibManager(background_task_enable)

    @response_types('application/json', default='application/json')
    def get(self, path, request):
        try:
            response = self.gpibmanager.get(path)
            status_code = 200
        except ParameterTreeError as e:
            response = {'error' : str(e)}
            status_code = 400

        content_type = 'application/json'

        return ApiAdapterResponse(response, content_type=content_type, 
                                    status_code=status_code)


    @request_types('application/json',"application/vnd.odin-native")
    @response_types('application/json', default='application/json')
    def put(self, path, request):
        content_type = 'application/json'
        try:
            data = decode_request_body(request)
            self.gpibmanager.set(path, data)
            response = self.gpibmanager.get(path)
            status_code = 200
        except GpibManagerError as e:
            response = {'error': str(e)}
            status_code = 400
        except (TypeError, ValueError) as e:
            response = {'error': 'Failed to decode PUT request body: {}'.format(str(e))}
            status_code = 400

        return ApiAdapterResponse(response, content_type=content_type, status_code=status_code)


    def delete(self, path, request):
        response = 'GpibAdapter: DELETE on path {}'.format(path)
        status_code =200

        logging.debug(response)

        return ApiAdapterResponse(response, status_code=status_code)

    def cleanup(self):
        """Clean up adapter state at shutdown."""

        self.gpibmanager.cleanup()    


class GpibManagerError(Exception):

    pass

class GpibManager():

    executor = futures.ThreadPoolExecutor(max_workers=1)

    def __init__(self, background_task_enable):

        """ Initalises the pyvisa resource manager to get a connection
        to the GPIB controller """
        self.lock = threading.Lock()
        self.driver_available = False
        self.device_available = False
        self.resources = None
        self.resource_list = None

        self.param_tree = None

        self.initialise_devices()

        self.remote_mode_enable = 1
        self.background_task_enable = 1 if self.device_available else 0
        
        if self.background_task_enable:
            self.start_background_task()

    @contextmanager
    def suppress_stderr_output(self):
        """
        Context manager that temporarily redirects stderr to /dev/null, for suppressing 
        C library error messages cannot be controlled by pythons logging level settings
        by writing directly to stderr file descriptor.
        
        Returns:
            None: Yields control back to the calling context with stderr redirected
        """
        original_stderr_fd = os.dup(2)  # Make a copy of the original stderr file descriptor
        null_device_fd = os.open(os.devnull, os.O_WRONLY)  # Open /dev/null for writing
        
        try:
            os.dup2(null_device_fd, 2)  # Redirect stderr to /dev/null
            os.close(null_device_fd)  # Close the duplicate
            yield  # Give control back to the with-block
        finally:
            # Restore original stderr even if exceptions occur
            os.dup2(original_stderr_fd, 2)
            os.close(original_stderr_fd)

    def initialise_devices(self, *args):
        """ 
        Function to establish state of GPIB readiness, and build device trees 
        for any connected devices. 
        """
        # If a resource manager is already open try to close it
        try:
            if self.resources:
                self.resources.close()
                logging.debug("Closed resource manager")
        except:
            logging.error(f"Could not close resource: {self.resource}")

        # Supress the libgpib error messages for probing addresses.
        with self.suppress_stderr_output():
            # Check GPIB driver is installed
            with warnings.catch_warnings(record=True) as wrn:
                warnings.simplefilter("always")

                # try to open the resource manager, and contact the gpib driver
                self.resources = pyvisa.ResourceManager("@py")
                self.resource_list = self.resources.list_resources()
                self.driver_available = True

                # check for specific warning message from gpib library
                if any("GPIB library not found" in str(w.message) for w in wrn):
                    logging.error("GPIB driver not available")
                    self.resource_list = []
                    self.driver_available = False              

            # Check NI-USB-GPIB is available
            if self.driver_available:
                try:
                    intf = self.resources.open_resource("GPIB0::INTFC")
                    intf.close()
                    self.device_available = True
                except Exception as e:
                    logging.error("GPIB interface not available")

        #empty dictionary of devices
        self.devices = {}

        """ iterates through the resource list and matches found
        devices to a list of known devices """

        for self.resource in self.resource_list:
            self.device = self.resources.open_resource(self.resource)
            print(self.device, "from adapter.py")
            self.ident = self.device.query('*IDN?')

            device_cls = None    
            if "MODEL 2410" in self.ident:
                logging.debug("model 2410 Detected")
                device_cls = K2410

            if "MODEL 2510" in self.ident:
                logging.debug("model 2510 Detected")
                device_cls = K2510

            if device_cls:
                device = device_cls(self.device, self.ident, self.lock)
                device_name = device.type + '_' + str(device.bus_address)
                self.devices[device_name] = device

        # Parameter tree that holds information about the detected devices
        self.param_tree = ParameterTree({
            'driver_available': (lambda: self.driver_available, None),
            'device_available': (lambda: self.device_available, None),
            'num_devices': (lambda: len(self.devices), None),
            'device_ids': (lambda: [id for id in self.devices.keys()], None),
            'devices': {name: device.param_tree for name, device in self.devices.items()},
            'refresh_devices': (lambda: None, lambda value: self.initialise_devices(value))
        })

    def get(self, path):
        """Get the parameter tree. """ 

        return self.param_tree.get(path)

    def set(self, path, data):
        """Set parameters in the parameter tree. """

        try:
            self.param_tree.set(path, data)
        except ParameterTreeError as e:
            raise GpibManagerError(e)

    def cleanup(self):
        """Clean up the Adapter instance. """

        logging.debug("Cleanup function called!")
        self.stop_background_task()

   
    def set_remote_enable(self,r_enable):
        """ Enable and disable all the functions of the adapter, when disabled
        the adapter will set all the devices to local mode so that they can be
        controllerd manually """

        r_enable = bool(r_enable)
        self.remote_mode_enable = r_enable
        if r_enable:
            self.start_background_task()
            logging.debug("remote mode enabled, local key pressed")
            logging.debug("Remote global variable =: %s", self.remote_mode_enable)
        else:
            self.stop_background_task()
            logging.debug("remote mode disabled, local key pressed")
            logging.debug("Remote global variable =: %s", self.remote_mode_enable)
            #with self.gpib_lock:
                #self.k2410.write(':SYSTEM:KEY 23')


    def start_background_task(self):
        """ Changes the value of the enable variable to True and calls the 
        background task function """
        self.background_task_enable = True
        self.background_task()

    def stop_background_task(self):
        """ Disables the background task by altering its control variable """
        self.background_task_enable = False

    @run_on_executor
    def background_task(self):        
        """ Runs the update function of all the loaded devices """
        logging.info("Background Task Running")
        while self.background_task_enable:
            if self.remote_mode_enable:
                            
                for device in self.devices.values():
                    if (device.ret_control_state()):
                        device.update()
                time.sleep(1)
                