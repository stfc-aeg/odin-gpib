import pyvisa
import threading
import logging

class GpibDevice():

    def __init__(self, device, ident, lock):
        self.device_control_enable = False

        self.lock = lock
        self.device = device
        self.bus_address = self.device.primary_address
        self.ident = ident.strip()
        self.type = ""

        self.last_error = "No recorded errors"
        self.error_count = 0

        self.identify = False

    def set_identify(self, identify):
        # If identify toggle is turned on,
        # display the identify message on the device screen.
        # To do this, message state needs to be turned on.
        # Max character length for top display message = 12 characters.
        # Max character length for bottom display message = 32 characters.
        # device_name is formed consisting of the machine's type and bus_address,
        # it will be in the format K1234_56

        if (identify == True):
            device_name = "{:s}_{:d}".format(self.type, self.bus_address)
            self.write(':DISP:WINDOW1:TEXT:DATA "Identify"')
            self.write(':DISP:WINDOW1:TEXT:STAT 1')
            self.write(':DISP:WINDOW2:TEXT:DATA "' + device_name + '"')
            self.write(':DISP:WINDOW2:TEXT:STAT 1')
        # Else, disable the message state to remove the message
        else:
            self.write(':DISP:WINDOW1:TEXT:STAT 0')
            self.write(':DISP:WINDOW2:TEXT:STAT 0')

        self.identify = identify

    def __repr__(self):
        #when devices is printed it will show the idnt and at the address
        return f'{self.ident}, at addr {self.device.primary_address}'

    def device_id(self):
        #print("Printing from the GpibDevice class inside gpibdevice.py")
        pass

    def update(self):
        pass

    def write(self, cmd):
        if self.device_control_enable:  
            with self.lock:
                self.device.write(cmd)
                #ret = self.device.write(cmd)
                #return ret
        if (":SYSTEM:KEY" in cmd):
            with self.lock:
                self.device.write(cmd)
                #ret = self.device.write(cmd)
                #return ret

    def query(self, cmd):
        if self.device_control_enable:
            try:
                with self.lock:
                    ret = self.device.query(cmd)
                    return ret
            except:
                with self.lock:
                    self.error_count += 1
                    self.last_error = "Something went wrong"
                    return None


    def query_ascii_values(self, cmd):
        print(self.bus_address,": Last Error: ",self.last_error," | No of Errors: ",self.error_count)
        if self.device_control_enable:
            try:
                with self.lock:
                    ret = self.device.query_ascii_values(cmd)
                    return ret
            except UnicodeDecodeError:
                with self.lock:
                    self.error_count += 1
                    self.last_error = "UnicodeDecodeError"
                    return None
            except:
                self.error_count += 1
                self.last_error = "Something went wrong"
                return None


    def ret_control_state(self):
        return self.device_control_enable