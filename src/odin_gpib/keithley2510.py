import pyvisa
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
from odin_gpib.gpibdevice import GpibDevice

class K2510(GpibDevice):

    def __init__(self, device, ident, lock):

        super().__init__(device, ident, lock)
        self.type = 'K2510'

        self.device_control_enable = True
        self.param_tree = ParameterTree({
            'device_control_state': (lambda: self.device_control_enable, self.set_control_enable),
            'type': (lambda: self.type, None),
            'ident': (lambda: self.ident, None),
            'address': (lambda: self.bus_address, None),
        })

    def set_control_enable(self, device_control_enable):
        self.device_control_enable = device_control_enable
        if (self.device_control_enable == False):
            self.write(':SYSTEM:KEY 16')
    
    def get_idn(self):
        print(self.device.query('*IDN?'),"Sent from keithley2510.py")
        print(self.device, "from k2510")
        
    def update(self):
        self.get_idn()