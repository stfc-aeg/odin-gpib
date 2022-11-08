import pyvisa
import threading
import logging

from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
from zmq import device
from odin_gpib.gpibdevice import GpibDevice

class K2410(GpibDevice):

    def __init__(self, device, ident, lock):

        super().__init__(device, ident, lock)
        self.type = 'K2410'
        self.info = (self.type + "_" + str(self.device.primary_address))

        self.device_control_enable = True

        self.filter_set_enable = ""
        self.filter_set_type = ""
        self.filter_curr_type = ""
        self.filter_curr_count = 0
        self.filter_count_setpoint = 1
        self.filter_curr_state = ""

        self.voltage_set_range = ""
        self.voltage_curr_range = 0.0
        self.voltage_setpoint = 0.0 
        self.voltage_meas = 0.0

        self.current_comp_setpoint = 0.0
        self.current_meas = 0.0
        self.current_curr_comp = 0.0
        
        filter_controls = ParameterTree({
            'filter_enable' : (lambda: self.filter_set_enable, self.set_filter_enable),
            'filter_type' : (lambda: self.filter_set_type, self.set_filter_type),
            'filter_count' : (lambda: self.filter_count_setpoint, self.set_filter_count),
            'filter_curr_type' : (lambda: self.filter_curr_type, None),
            'filter_curr_count' : (lambda: self.filter_curr_count, None),            
            'filter_state' : (lambda: self.filter_curr_state, None)
        })

        voltage_controls = ParameterTree({
            'voltage_range' : (lambda: self.voltage_set_range, self.set_voltage_range),
            'voltage_curr_range' : (lambda: self.voltage_curr_range, None),
            'voltage_set' : (lambda: self.voltage_setpoint, self.set_voltage),
            'voltage_measurement' : (lambda: self.voltage_meas, None)
        })

        current_controls = ParameterTree({
            'current_measurement' : (lambda: self.current_meas, None),
            'current_curr_comp' : (lambda: self.current_curr_comp, None),
            'current_comp_set' : (lambda : self.current_comp_setpoint, self.set_current_comp)
        })

        self.param_tree = ParameterTree({
            'device_control_state': (lambda: self.device_control_enable, self.set_control_enable),
            'type': (lambda: self.type, None),
            'ident': (lambda: self.ident, None),
            'address': (lambda: self.bus_address, None),
            'filter': filter_controls,
            'voltage': voltage_controls,
            'current': current_controls
            })

    def set_control_enable(self, device_control_enable):
        self.device_control_enable = device_control_enable
        if (self.device_control_enable == False):
            self.write(':SYSTEM:KEY 23')
                                               
    def get_voltage_measurement(self):
        if self.device_control_enable:
            self.voltage_meas = (self.query_ascii_values(':MEAS:VOLT?')[0])
            logging.debug("Voltage from %s", self.info + " = " + (str(self.voltage_meas)))

    def get_voltage_range(self):
        if self.device_control_enable:
            self.voltage_curr_range = (self.query((':SOUR:VOLT:RANG?')))
        

    def get_filter_state(self):
        if self.device_control_enable:
            self.filter_curr_state = (self.query(':SENS:AVER:STAT?'))
            if "1" in self.filter_curr_state:
                self.filter_curr_state = "Enabled"
            elif "0" in self.filter_curr_state:
                self.filter_curr_state = "Disabled"
            else: 
                pass

    def get_filter_curr_count(self):
        if self.device_control_enable:
            self.filter_curr_count = (self.query(':SENS:AVER:COUN?'))

    def get_filter_curr_type(self):
        if self.device_control_enable:
            self.filter_curr_type = (self.query(':SENS:AVER:TCON?'))
            if "MOV" in self.filter_curr_type:
                self.filter_curr_type = "Moving"
            elif "REP" in self.filter_curr_type:
                self.filter_curr_type = "Repeating"
            else: 
                pass

    def get_current_measurement(self):
        if self.device_control_enable:
            self.current_meas = (self.query_ascii_values(':MEAS:CURR?')[1])

    def get_current_comp(self):
        if self.device_control_enable:
            self.current_curr_comp = (self.query_ascii_values(':SENS:CURR:PROT?'))

    def set_current_comp(self, curr_comp_setpoint):
        if self.device_control_enable:
            curr_comp_setpoint = str(curr_comp_setpoint)
            curr_comp_format = str(':SENS:CURR:PROT %sE-3' %curr_comp_setpoint)
            self.write((curr_comp_format))

    def set_voltage(self, voltage_setpoint):
        if self.device_control_enable:
            voltage_setpoint = str(voltage_setpoint)
            self.write((':SOUR:VOLT:LEV %s' %voltage_setpoint))

    def set_voltage_range(self, voltage_set_range):
        if self.device_control_enable:
            self.voltage_set_range = voltage_set_range
            self.write((':SOUR:VOLT:RANG %s' %voltage_set_range))

    def set_filter_count(self, filter_count_setpoint):
        if self.device_control_enable:
            filter_count_setpoint = str(filter_count_setpoint)
            self.filter_count_setpoint = filter_count_setpoint
            self.write(':SENS:AVER:COUN %s' %filter_count_setpoint)

    def set_filter_type(self, filter_type):
        if self.device_control_enable:
            self.filter_set_type = filter_type
            self.write(':SENS:AVER:TCON %s' %filter_type)

    def set_filter_enable(self, filter_enable):
        if self.device_control_enable:
            if "1" in filter_enable:
                self.write(':SENS:AVER ON')
            elif "0" in filter_enable:
                self.write(':SENS:AVER OFF')
            else: 
                pass

    def update(self):
        if self.device_control_enable:
            self.get_filter_state()
            self.get_filter_curr_count()
            self.get_filter_curr_type()

            self.get_voltage_measurement()
            self.get_voltage_range()

            self.get_current_comp()
            self.get_current_measurement()

