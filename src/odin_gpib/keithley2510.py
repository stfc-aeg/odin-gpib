import pyvisa
import threading
import logging

from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
from odin_gpib.gpibdevice import GpibDevice

class K2510(GpibDevice):

    def __init__(self, device, ident, lock):

        super().__init__(device, ident, lock)
        self.type = 'K2510'

        self.current_limit = 0.0
        self.voltage_limit = 0.0
        self.temp_setpoint = 0.0

        self.tec_power = 0.0
        self.tec_current = 0.0
        self.tec_voltage = 0.0
        self.tec_temp_meas = 0.0
        self.tec_setpoint = 0.0
        self.tec_volt_lim = 0.0
        self.tec_curr_lim = 0.0

        self.device_control_enable = True
        self.output_state = False
        self.temp_over_state = False
        self.identify = False
        self.write(':DISP:WINDOW1:TEXT:STAT 0')
        self.write(':DISP:WINDOW2:TEXT:STAT 0')

        #Make outp? check function in gpibdevice class
        output_init_state = self.device.query(':OUTP?')
        if ("1" in output_init_state):
            self.output_state = True
        if ("0" in output_init_state):
            self.output_state = False
        
        print("OUTPUT: ",self.output_state)

        setpoints = ParameterTree({
            'c_lim_set': (lambda: self.current_limit, self.set_current_limit),
            'v_lim_set': (lambda: self.voltage_limit, self.set_voltage_limit),
            'temp_set': (lambda: self.temp_setpoint, self.set_temp_point)
        })

        tec_information = ParameterTree({
            'tec_power': (lambda: self.tec_power, None),
            'tec_current': (lambda: self.tec_current, None),
            'tec_voltage': (lambda: self.tec_voltage, None),
            'tec_temp_meas': (lambda: self.tec_temp_meas, None),
            'tec_setpoint': (lambda: self.tec_setpoint, None),
            'tec_volt_lim': (lambda: self.tec_volt_lim, None),
            'tec_curr_lim': (lambda: self.tec_curr_lim, None)
        })

        self.param_tree = ParameterTree({
            'output_state': (lambda: self.output_state, self.set_output_state),
            'device_control_state': (lambda: self.device_control_enable, self.set_control_enable),
            'temp_over_state': (lambda: self.temp_over_state, self.set_temp_over_state),
            'identify': (lambda: self.identify, self.set_identify),
            #'identify': (lambda: self.identify, GpibDevice.set_identify(GpibDevice, device=self, identify=self.identify)),
            'type': (lambda: self.type, None),
            'ident': (lambda: self.ident, None),
            'address': (lambda: self.bus_address, None),
            'set': setpoints,
            'info': tec_information
        })

    def set_temp_over_state(self, temp_state):
        self.temp_over_state = temp_state

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

    def get_tec_volt_lim(self):
        volt_lim = (self.query_ascii_values(':SOUR:VOLT:PROT?'))
        if (volt_lim == None):
            pass
        else:
            self.tec_volt_lim = ("{:.6f}".format(float(volt_lim[0])))

    def get_tec_curr_lim(self):
        curr_lim = (self.query_ascii_values(':SENS:CURR:PROT?'))
        if (curr_lim == None):
            pass
        else:
            self.tec_curr_lim = ("{:.6f}".format(float(curr_lim[0])))

    def get_tec_power(self):
        tec_power = (self.query_ascii_values(':MEAS:POW?'))
        if (tec_power == None):
            pass
        else:
            self.tec_power = ("{:.6f}".format(float(tec_power[0])))

    def get_tec_current(self):
        tec_current = (self.query_ascii_values(':MEAS:CURR?'))
        if (tec_current == None):
            pass
        else:
            self.tec_current = ("{:.6f}".format(float(tec_current[0])))

    def get_tec_voltage(self):
        tec_voltage = (self.query_ascii_values(':MEAS:VOLT?'))
        if (tec_voltage == None):
            pass
        else:
            self.tec_voltage = ("{:.6f}".format(float(tec_voltage[0])))

    def get_tec_temp_meas(self):
        tec_temp_meas = (self.query_ascii_values(':MEAS:TEMP?'))
        if (tec_temp_meas == None):
            pass
        else:
            self.tec_temp_meas = ("{:.6f}".format(float(tec_temp_meas[0])))
            if (float(self.tec_temp_meas) > 40):
                logging.debug("Over temp")
                self.temp_over_state = True
                self.output_state = False
                self.write(':OUTP OFF')
            else:
                logging.debug("Under temp")

    def get_tec_setpoint(self):
        tec_setpoint = (self.query_ascii_values(':SOUR:TEMP?'))
        if (tec_setpoint == None):
            pass
        else:
            self.tec_setpoint = ("{:.6f}".format(float(tec_setpoint[0])))

    def get_output_state(self):
        output_state = self.query(':OUTP?')
        if (output_state == None):
            pass
        else:
            if ("1" in output_state):
                self.output_state = True
            if ("0" in output_state):
                self.output_state = False

    def set_temp_unit(self):
        self.write(':UNIT:TEMP CEL')

    def set_current_limit(self, current_limit):
        self.current_limit = current_limit
        current_limit = str(current_limit)
        self.write((':SENS:CURR:PROT %s' %current_limit))

    def set_voltage_limit(self, voltage_limit):
        self.voltage_limit = voltage_limit
        voltage_limit = str(voltage_limit)
        self.write((':SOUR:VOLT:PROT %s' %voltage_limit))

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
        if ((self.device_control_enable) and not(self.temp_over_state)):
            logging.debug("Updating k2510")
            self.get_output_state()
            self.get_tec_voltage()
            self.get_tec_current()
            self.get_tec_power()
            self.get_tec_temp_meas()
            self.get_tec_setpoint()
            self.get_tec_volt_lim()
            self.get_tec_curr_lim()