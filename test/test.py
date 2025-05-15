import pyvisa
resources = pyvisa.ResourceManager('@py')
instrument = resources.open_resource('GPIB::15::INSTR')
# Sub X for the address of the instrument
print(instrument.query('*IDN?'))
