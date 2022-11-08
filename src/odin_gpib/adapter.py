""" Adapter for Odin Control to detect and control various keithley 
instruments over a GPIB interface using PyVisa """

from concurrent.futures import thread
from odin_gpib.keithley2410 import K2410 
from odin_gpib.keithley2510 import K2510

import time
import pyvisa
import logging
import threading
from concurrent import futures

from tornado.concurrent import run_on_executor
from tornado.escape import json_decode

from odin.adapters.adapter import ApiAdapter, ApiAdapterResponse, request_types, response_types
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError



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

    @request_types('application/json')
    @response_types('application/json', default='application/json')
    def put(self, path, request):

        content_type = 'application/json'

        try:
            data = json_decode(request.body)
            logging.debug(data)
            self.gpibmanager.set(path, data)
            response = self.gpibmanager.get(path)
            status_code = 200
        except GpibManagerError as e:
            response = {'error': str(e)}
            status_code = 400
        except (TypeError, ValueError) as e:
            response = {'error': 'Failed to decode PUT request body: {}'.format(str(e))}
            status_code = 400

        logging.debug(response)

        return ApiAdapterResponse(response, content_type=content_type, 
                                    status_code=status_code)

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

        self.resources = pyvisa.ResourceManager('@py')
        self.resource_list=(self.resources.list_resources())

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
                logging.debug("model 2410 check")
                device_cls = K2410

            if "MODEL 2510" in self.ident:
                logging.debug("model 2510 check")
                device_cls = K2510

            if device_cls:
                device = device_cls(self.device, self.ident, self.lock)
                device_name = device.type + '_' + str(device.bus_address)
                self.devices[device_name] = device

        """ Parameter tree that holds information about the detected devices"""

        self.param_tree = ParameterTree({
            'num_devices': (lambda: len(self.devices), None),
            'device_ids': (lambda: [id for id in self.devices.keys()], None),
            'devices': {name: device.param_tree for name, device in self.devices.items()}
        })



        """ Setting inital values for variables"""
 
        self.remote_mode_enable = 1
        self.background_task_enable =1
        
        if self.background_task_enable:
            self.start_background_task()

        ####    END OF INIT    ####    

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

        while self.background_task_enable:
            if self.remote_mode_enable:
                            
                for device in self.devices.values():
                    logging.debug("LOOPING" + str(device.ret_control_state()))
                    if (device.ret_control_state()):
                        device.update()

                    #print(device.ret_control_state)
                    

                """ Controls the speed of the background task calls """
                time.sleep(1)
                