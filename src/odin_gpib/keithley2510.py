import pyvisa
import threading
import logging

from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
from odin_gpib.gpibdevice import GpibDevice

class K2510(GpibDevice):

    def __init__(self, device, ident, lock):

        super().__init__(device, ident, lock)
        self.type = 'K2510'

        self.temp_up_limit = 20.0 
        self.temp_down_limit = 10.0
        self.temp_setpoint = 15.0

        self.tec_power = 0.0
        self.tec_current = 0.0
        self.tec_voltage = 0.0
        self.tec_temp_meas = 0.0
        self.tec_setpoint = 0.0

        self.device_control_enable = True
        self.output_state = False

        #Make outp? check function in gpibdevice class
        output_init_state = self.device.query(':OUTP?')
        if ("1" in output_init_state):
            self.output_state = True
        if ("0" in output_init_state):
            self.output_state = False
        
        print("OUTPUT: ",self.output_state)

        temp_controls = ParameterTree({
            'temp_up_limit': (lambda: self.temp_up_limit, self.set_temp_up),
            'temp_down_limit': (lambda: self.temp_down_limit, self.set_temp_down),
            'temp_set': (lambda: self.temp_setpoint, self.set_temp_point)
        })

        tec_information = ParameterTree({
            'tec_power': (lambda: self.tec_power, None),
            'tec_current': (lambda: self.tec_current, None),
            'tec_voltage': (lambda: self.tec_voltage, None),
            'tec_temp_meas': (lambda: self.tec_temp_meas, None),
            'tec_setpoint': (lambda: self.tec_setpoint, None)
        })

        self.param_tree = ParameterTree({
            'output_state': (lambda: self.output_state, self.set_output_state),
            'device_control_state': (lambda: self.device_control_enable, self.set_control_enable),
            'type': (lambda: self.type, None),
            'ident': (lambda: self.ident, None),
            'address': (lambda: self.bus_address, None),
            'temp': temp_controls,
            'info': tec_information
        })

    def get_tec_power(self):
        self.tec_power = ("{:.6f}".format(float(self.query_ascii_values(':MEAS:POW?')[0])))

    def get_tec_current(self):
        self.tec_current = ("{:.6f}".format(float(self.query_ascii_values(':MEAS:CURR?')[0])))

    def get_tec_voltage(self):
        self.tec_voltage = ("{:.6f}".format(float(self.query_ascii_values(':MEAS:VOLT?')[0])))

    def get_tec_temp_meas(self):
        self.tec_temp_meas = ("{:.6f}".format(float(self.query_ascii_values(':MEAS:TEMP?')[0])))
    
    def get_tec_setpoint(self):
        self.tec_setpoint = ("{:.6f}".format(float(self.query_ascii_values(':SOUR:TEMP?')[0])))

    def get_output_state(self):
        output_state = self.query(':OUTP?')
        if ("1" in output_state):
            self.output_state = True
        if ("0" in output_state):
            self.output_state = False

    def set_temp_unit(self):
        self.write(':UNIT:TEMP CEL')

    def set_temp_up(self, temp_up_limit):
        self.temp_up_limit = temp_up_limit
        temp_up_limit = str(temp_up_limit)
        self.write((':SOUR:TEMP:PROT %s' %temp_up_limit))

    def set_temp_down(self, temp_down_limit):
        self.temp_down_limit = temp_down_limit
        temp_down_limit = str(temp_down_limit)
        self.write((':SOUR:TEMP:PROT:LOW %s' %temp_down_limit))

    def set_temp_point(self, temp_setpoint):
        self.temp_setpoint = temp_setpoint
        temp_setpoint = str(temp_setpoint)
        self.write((':SOUR:TEMP %s' %temp_setpoint))

    def set_output_state(self, output_state):
        if output_state == False:
            output_state = "OFF"
            self.output_state = False
        elif output_state == True:
            output_state = "ON"
            self.output_state = True
        state_formatted = str(':OUTP %s' %output_state)
        self.write((state_formatted))

    def set_control_enable(self, device_control_enable):
        self.device_control_enable = device_control_enable
        if (self.device_control_enable == False):
            self.write(':SYSTEM:KEY 16')

    def update(self):
        if self.device_control_enable:
            self.get_output_state()
            self.get_tec_voltage()
            self.get_tec_current()
            self.get_tec_power()
            self.get_tec_temp_meas()
            self.get_tec_setpoint()