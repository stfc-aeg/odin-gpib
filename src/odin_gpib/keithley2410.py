import pyvisa
import threading
import logging
import decimal
import time

from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
from odin_gpib.gpibdevice import GpibDevice

from concurrent.futures import thread
from tornado.concurrent import run_on_executor
from concurrent import futures

class K2410(GpibDevice):
    executor = futures.ThreadPoolExecutor(max_workers=1)

    def __init__(self, device, ident, lock):

        super().__init__(device, ident, lock)
        self.type = 'K2410'
        self.info = (self.type + "_" + str(self.device.primary_address))

        self.output_state = False

        output_init_state = self.device.query(':OUTP?')
        if ("1" in output_init_state):
            self.output_state = True
        if ("0" in output_init_state):
            self.output_state = False
        
        print("OUTPUT: ",self.output_state)

        self.device_control_enable = True
        self.ramping_flag = False
        self.identify = False
        self.write(':DISP:WINDOW1:TEXT:STAT 0')
        self.write(':DISP:WINDOW2:TEXT:STAT 0')

        self.filter_set_enable = ""
        self.filter_set_type = ""
        self.filter_curr_type = ""
        self.filter_curr_count = 0
        self.filter_count_setpoint = 1
        self.filter_curr_state = ""

        self.voltage_set_range = ""
        self.voltage_curr_range = 0.0
        self.voltage_setpoint = 0.0 
        self.voltage_ramp_setpoint = 0.0
        self.voltage_meas = 0.0
        self.voltage_time = 0

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
            'voltage_ramp_set' : (lambda: self.voltage_ramp_setpoint, self.set_ramp_voltage),
            'voltage_time' : (lambda: self.voltage_time, self.set_time),
            'voltage_measurement' : (lambda: self.voltage_meas, None)
        })

        current_controls = ParameterTree({
            'current_measurement' : (lambda: self.current_meas, None),
            'current_curr_comp' : (lambda: self.current_curr_comp, None),
            'current_comp_set' : (lambda : self.current_comp_setpoint, self.set_current_comp)
        })

        self.param_tree = ParameterTree({
            'output_state': (lambda: self.output_state, self.set_output_state),
            'device_control_state': (lambda: self.device_control_enable, self.set_control_enable),
            'ramping_flag': (lambda: self.ramping_flag, self.set_ramping_flag),
            'identify': (lambda: self.identify, self.set_identify),
            'type': (lambda: self.type, None),
            'ident': (lambda: self.ident, None),
            'address': (lambda: self.bus_address, None),
            'filter': filter_controls,
            'voltage': voltage_controls,
            'current': current_controls
            })

    def set_time(self, time):
        self.voltage_time = time
    
    def set_ramping_flag(self,flag):
        self.ramping_flag = flag

    def get_output_state(self):
        output_state = self.query(':OUTP?')
        if (output_state == None):
            pass
        else:
            if ("1" in output_state):
                self.output_state = True
            if ("0" in output_state):
                self.output_state = False
    
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
            self.write(':SYSTEM:KEY 23')

    def set_identify(self, identify):
        self.identify = identify
        #ident = self.ident
        # If identify toggle turned on, display the identify message on the screen.
        # To do this, message state needs to be turned on.
        # Max character length for top display message = 12 characters
        # Max character length for bottom display message = 32 characters
        if (self.identify == True):
            self.write(':DISP:WINDOW1:TEXT:DATA "Identify"')
            self.write(':DISP:WINDOW1:TEXT:STAT 1')
            self.write(':DISP:WINDOW2:TEXT:DATA "Bottom Text - Yay"')
            self.write(':DISP:WINDOW2:TEXT:STAT 1')
        # Else, disable the message state to remove the message
        else:
            self.write(':DISP:WINDOW1:TEXT:STAT 0')
            self.write(':DISP:WINDOW2:TEXT:STAT 0')
                                               
    def get_voltage_measurement(self):
        voltage_meas = (self.query_ascii_values(':MEAS:VOLT?'))
        if (voltage_meas == None):
            pass
        else:
            self.voltage_meas = (voltage_meas[0])

    def get_voltage_range(self):
        voltage_curr_range = (self.query((':SOUR:VOLT:RANG?')))
        if (voltage_curr_range == None):
            pass
        else:
            self.voltage_curr_range = voltage_curr_range
        
    def get_filter_state(self):
        filter_curr_state = (self.query(':SENS:AVER:STAT?'))
        if (filter_curr_state == None):
            pass
        else:
            if "1" in filter_curr_state:
                self.filter_curr_state = "Enabled"
            elif "0" in filter_curr_state:
                self.filter_curr_state = "Disabled"
            else: 
                pass

    def get_filter_curr_count(self):
        filter_curr_count = (self.query(':SENS:AVER:COUN?'))
        if (filter_curr_count == None):
            pass
        else:
            self.filter_curr_count = filter_curr_count        

    def get_filter_curr_type(self):
        filter_curr_type = (self.query(':SENS:AVER:TCON?'))
        if (filter_curr_type == None):
            pass
        else:
            self.filter_curr_type = filter_curr_type
            if "MOV" in self.filter_curr_type:
                self.filter_curr_type = "Moving"
            elif "REP" in self.filter_curr_type:
                self.filter_curr_type = "Repeating"
            else: 
                pass        

    def get_current_measurement(self):
        current_meas = (self.query_ascii_values(':MEAS:CURR?'))
        if (current_meas == None):
            pass
        else:
            self.current_meas = (current_meas[1])

    def get_current_comp(self):
        current_curr_comp = (self.query_ascii_values(':SENS:CURR:PROT?'))
        if (current_curr_comp == None):
            pass
        else:
            self.current_curr_comp = current_curr_comp

    def set_current_comp(self, curr_comp_setpoint):
        curr_comp_setpoint = str(curr_comp_setpoint)
        curr_comp_format = str(':SENS:CURR:PROT %sE-3' %curr_comp_setpoint)
        self.write((curr_comp_format))

    def set_voltage(self, voltage_setpoint):
        if (not(self.ramping_flag)):
            voltage_setpoint = str(voltage_setpoint)
            self.write((':SOUR:VOLT:LEV %s' %voltage_setpoint))

    def set_voltage_range(self, voltage_set_range):
        if (not(self.ramping_flag)):
            self.voltage_set_range = voltage_set_range
            self.write((':SOUR:VOLT:RANG %s' %voltage_set_range))

    def set_filter_count(self, filter_count_setpoint):
        filter_count_setpoint = str(filter_count_setpoint)
        self.filter_count_setpoint = filter_count_setpoint
        self.write(':SENS:AVER:COUN %s' %filter_count_setpoint)

    def set_filter_type(self, filter_type):
        self.filter_set_type = filter_type
        self.write(':SENS:AVER:TCON %s' %filter_type)

    def set_filter_enable(self, filter_enable):
        if "1" in filter_enable:
            self.write(':SENS:AVER ON')
        elif "0" in filter_enable:
            self.write(':SENS:AVER OFF')
        else: 
            pass

    def update(self):
        self.get_output_state()
        if (self.output_state) and (self.device_control_enable):       
            self.get_filter_state()
            self.get_filter_curr_count()
            self.get_filter_curr_type()

            self.get_voltage_measurement()
            self.get_voltage_range()

            self.get_current_comp()
            self.get_current_measurement()

    @run_on_executor
    def set_ramp_voltage(self, voltage_setpoint):
        self.ramping_flag = True

        volt_measurement = self.voltage_meas
        setpoint = float(voltage_setpoint)
        increment = (float("{:.2f}".format((setpoint-volt_measurement)/(self.voltage_time))))
        count = 0

        if increment < 0:
            count = volt_measurement
            while ((count > setpoint) and self.ramping_flag):
                count += increment
                if count <  setpoint:
                    count = setpoint
                v_set = str(count)
                self.write((':SOUR:VOLT:LEV %s' %v_set))
                
                time.sleep(1)

        if increment > 0: 
            count = volt_measurement 
            while ((count < setpoint) and self.ramping_flag):
                count += increment
                if count > setpoint:
                    count = setpoint
                v_set = str(count)
                self.write((':SOUR:VOLT:LEV %s' %v_set))
                
                time.sleep(1)

        self.ramping_flag = False