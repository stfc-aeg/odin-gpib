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
    
    def __repr__(self):
        #when devices is printed it will show the idnt and at the address
        return f'{self.ident}, at addr {self.device.primary_address}'

    def device_id(self):
        print("Printing from the GpibDevice class inside gpibdevice.py")

    def update(self):
        pass

    def write(self, cmd):
        print(self.device,"inside device.py", + self.device_control_enable)
        if self.device_control_enable:  
            with self.lock:
                ret = self.device.write(cmd)
                return ret
        if (":SYSTEM:KEY" in cmd):
            with self.lock:
                ret = self.device.write(cmd)
                return ret 

    def query(self, cmd):
        print(self.device,"inside device.py", + self.device_control_enable)
        if self.device_control_enable:
            with self.lock:
                ret = self.device.query(cmd)
                return ret

    def query_ascii_values(self, cmd):
        print(self.device,"inside device.py", + self.device_control_enable)
        if self.device_control_enable:            
            with self.lock:
                ret = self.device.query_ascii_values(cmd)
                return ret

    
    def ret_control_state(self):
        return self.device_control_enable