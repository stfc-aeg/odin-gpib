api_version = '0.1';
id_list = [];
K2410_devices = [];
K2510_devices = [];
var up_i = 0;

//runs when the script is loaded
$( document ).ready(function() {
    update_api_version();
    update_api_adapters();
    update_detected_devices();
});

//gets the most up to date api version
function update_api_version() {
    $.getJSON('/api', function(response) {
        $('#api-version').html(response.api);
        api_version = response.api;
    });
}

//obtains the current loaded api adapters
function update_api_adapters() {
    $.getJSON('/api/' + api_version + '/adapters/', function(response) {
        adapter_list = response.adapters.join(", ");
        $('#api-adapters').html(adapter_list);
    });
}

//interrogates the parameter tree to get the current list of connected GPIB devices
function update_detected_devices() {
    $.getJSON('/api/' + api_version + '/gpib/', function(response) {
        id_list = response.device_ids;
        console.log(id_list);
        //id_list = ['K2510_15','K2410_27'];
        var ids_formatted_list = response.device_ids.join(", ");
        $('#gpib-ids').html(ids_formatted_list);
        call_device_functions(id_list);
    }); 
}

//iterates through the id list and puts the id's into lists based on their type
function call_device_functions(id_list){
    for (let x in id_list) {  		
        if (id_list[x].includes("K2410")){
            K2410_devices.push(id_list[x]);          
        }
        if (id_list[x].includes("K2510")){
            K2510_devices.push(id_list[x]);
        }
    }
    create_K2410_interfaces();
    create_K2510_interfaces();
}

//iterates through the list of K2410 devices and generates a new div containing the controls for that
//device, all the html id's are generated using the ID of the device to uniquely identify them and relate
//them back to that device, so they can be addressed by the rest of the program.
function create_K2410_interfaces(){
    var K2410_html = "";
    for (let x in K2410_devices) {
        var id = K2410_devices[x];
        K2410_html += `
        <div class = "instrument-panel">
        <div class = "device-label">
            <div class = "container-fluid">
                <div> Keithley 2410 power supply: ${id}</div>
                <div>
                    <label class = "switch-label" for = "enable-toggle-${id}">
                    <p>Enable control&nbsp&nbsp</p>
                    </label>
                    <label class = "switch">
                    <input type="checkbox" onclick="set_enable_k2410('${id}')" id="enable-toggle-${id}">
                    <span class="slider"> </span>
                    </label>
                </div>
                <div>
                    <label class = "switch-label" for = "output-toggle-${id}">
                    <p>Enable output&nbsp&nbsp&nbsp</p>
                    </label>
                    <label class = "switch">
                    <input class type="checkbox" onclick="set_output_k2410('${id}')" id="output-toggle-${id}">
                    <span class="slider"> </span>
                    </label>
                </div>
                <div>
                    <label class = "switch-label" for = "ramping-toggle-${id}">
                    <p>Enable ramping</p>
                    </label>
                    <label class = "switch">
                    <input class type="checkbox" onclick="set_ramping_k2410('${id}')" id="ramping-toggle-${id}">
                    <span class="slider"> </span>
                    </label>
                </div>
            </div>
        </div>
        <div class="row">
        <div class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Filter state: </th>
                    <td> <span id="filt-state-${id}"></span>
                        <select id = "filt-set-state-${id}" onChange="set_filter_state('${id}')">
                        <option value="" selected disabled hidden> </option>
                        <option value = "1">Enable filter</option>
                        <option value = "0">Disable filter</option>
                    </select>
                </td>
            </tr>
            <tr>
                <th> Selected filter type: </th>
                <td> <span id="filt-curr-type-${id}"></span>
                    <select id = "filt-set-type-${id}" onChange="set_filter_type('${id}')">
                        <option value="" selected disabled hidden> </option>
                        <option value = "MOV">Moving filter</option>
                        <option value = "REP">Repeating filter</option>
                    </select>
                </td>
            </tr>
            <tr>
                <th> Selected filter length: </th>
                <td> <span id="filt-curr-count-${id}"></span> values
                    <form>
                        <label for ="filt-set-count-${id}"> Filter length</label>
                        <input id="filt-set-count-${id}" type="text"/>
                        <input type="button" id="fc_set-${id}" value="Set" onclick="set_filter_count('filt-set-count-${id}','${id}')"/>
                    </form>
                </td>
            </tr>
        </tbody>
        </table>
        </div>

        <div class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Output state: </th>
                <td> <span id="out-state-${id}"></span</td>
            </tr>
            <tr>
                <th> Voltage measured: </th>
                <td> <span id="volt-meas-${id}"></span> V</td>
            </tr>
            <tr>
                <th> Selected voltage range: </th>
                <td> <span id="volt-curr-range-${id}"></span> V (Maximum +/-)
                    <select id = "volt-set-range-${id}" onChange="set_voltage_range('${id}')">
                    <option value="" selected disabled hidden> </option>
                        <option value = "0.21">mV range</option>
                        <option value = "2.1">2.1V range</option>
                        <option value = "21">21V range</option>
                        <option value = "1100">KV range</option>
                    </select>
                </td>
            </tr>
            <tr id="row1-${id}">
                <th> Set voltage level:  </th>
                <td>
                    <form>
                        <label for ="volt-set-level-${id}"> Voltage: </label>
                        <input id="volt-set-level-${id}" type="text"/>
                        <input type = "button" id="vl_set-${id}" value="Set" onclick="set_voltage_level('volt-set-level-${id}','${id}')" />
                    </form>
                </td>
            </tr>
            <tr id="row2-${id}">
            <th> Set voltage level:  </th>
            <td>
                <form>
                    <label for ="volt-ramp-set-level-${id}"> Voltage: </label>
                    <input id="volt-ramp-set-level-${id}" type="text"/>
                    <input type = "button" id="vlr_set-${id}" value="Set" onclick="set_voltage_ramp_level('volt-ramp-set-level-${id}','time-to-set-${id}','${id}')" />
                    <input type = "button" id="vr_cancel-${id}" value="Cancel" onclick="cancel_ramp('${id}')" />
                </form>
            </td>
        </tr>
        <tr id="row3-${id}">
        <th> Time to reach voltage (S):  </th>
        <td>
            <form>
                <label for ="time-to-set-${id}"> Time: </label>
                <input id="time-to-set-${id}" type="text"/>
            </form>
        </td>
    </tr>
        </tbody>
        </table>
        </div>

        <div class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Current measured: </th>
                <td> <span id="curr-meas-${id}"></span></td>
            </tr>
            <tr>
                <th> Compliance current: </th>
                <td> <span id="curr-comp-meas-${id}"></span></td>
            </tr>
            <tr>
                <th> Set compliance current:  </th>
                <td>
                    <form>
                        <label for ="curr-set-comp-${id}"> Compliance (mA): </label>
                        <input id="curr-set-comp-${id}" type="text"/>
                        <input type = "button" id="cc_set-${id}" value="Set" onclick="set_current_comp('curr-set-comp-${id}','${id}')"/>
                    </form>
                </td>
            </tr>
        </tbody>
        </table>
        </div>
        </div>
        </div>
        `
        $("#K2410test").html(K2410_html);
    }
    for (let x in K2410_devices) {
        var id = K2410_devices[x];
        set_ramping_inital(id)
    }
    poll_update_k2410_elements();
}

function set_ramping_inital(id){
    document.getElementById('row1-'+id).style.display = '';
    document.getElementById('row2-'+id).style.display = 'none';
    document.getElementById('row3-'+id).style.display = 'none';
}

//iterates through the list of K2510 devices and generates a new div containing the controls for that
//device, all the html id's are generated using the ID of the device to uniquely identify them and relate
//them back to that device, so they can be addressed by the rest of the program.
function create_K2510_interfaces(){
    var K2510_html = "";
    for (let x in K2510_devices) {
        var id = K2510_devices[x];
        K2510_html += `
        <div class = "instrument-panel">
        <div class = "device-label">
            <div class = "container-fluid">
                <div> Keithley 2510 Peltier Controller: ${id}</div>
                <div>
                    <label class = "switch-label" for = "enable-toggle-${id}">
                    Enable control&nbsp&nbsp
                    </label>
                    <label class = "switch">
                        <input type="checkbox" onclick="set_enable_k2510('${id}')" id="enable-toggle-${id}">
                        <span class="slider"> </span>
                    </label>
                </div>

                <div>
                    <label class = "switch-label" for = "output-toggle-${id}">
                    <p>Enable output</p>
                    </label>
                    <label class = "switch">
                    <input type="checkbox" onclick="set_output_k2510('${id}')" id="output-toggle-${id}">
                    <span class="slider"> </span>
                    </label>
                </div>
                    <div>
                        <button onclick="set_over_temp('${id}')" id="reset-temp-${id}">Reset over_temp state</button>
                    </div>
            </div>
        </div>
        <ul class="row">
        <li class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Output state: </th>
                <td> <span id="tec-out-state-${id}"></span></td>
            </tr>
            <tr>
                <th> Current temperature: </th>
                <td> <span id="curr-temp-meas-${id}"></span> °C</td>
            </tr>
            <tr>
                <th> Temperature setpoint: </th>
                <td> <span id="tec-set-point-${id}"></span> °C</td>
            </tr>
            <tr>
                <th> TEC power: </th>
                <td> <span id="tec-power-meas-${id}"></span> W</td>
            </tr>
            <tr>
                <th> TEC voltage: </th>
                <td> <span id="tec-volt-meas-${id}"></span> V</td>
            </tr>
            <tr>
                <th> TEC current: </th>
                <td> <span id="tec-current-meas-${id}"></span> A</td>
            </tr>
        </tbody>
        </table>
        </li>
        <li class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Set current limit:  </th>
                <td>
                    <form>
                        <label for ="curr-set-limit-${id}"> Current: </label>
                        <input id="curr-set-limit-${id}" type="text"/>
                        <input type = "button" id="c_lim_set-${id}" value="Set" onclick="set_current_limit('curr-set-limit-${id}','${id}')" />
                    </form> 
                </td>
            </tr>
            <tr>
            <th> Set voltage limit:  </th>
            <td>
                <form>
                    <label for ="volt-set-limit-${id}"> Voltage: </label>
                    <input id="volt-set-limit-${id}" type="text"/>
                    <input type = "button" id="v_lim_set-${id}" value="Set" onclick="set_voltage_limit('volt-set-limit-${id}','${id}')" />
                </form>
            </td>
            </tr>
            </tr>
            <tr>
            <th> Set temp level:  </th>
            <td>
                <form>
                    <label for ="temp-set-level-${id}"> Temp: </label>
                    <input id="temp-set-level-${id}" type="text"/>
                    <input type = "button" id="tp_set-${id}" value="Set" onclick="set_temp_level('temp-set-level-${id}','${id}')" />
                </form>
            </td>
        </tr>
        </tbody>
        </table>
        </li>

        </ul>
        </div>
        `
        $("#K2510test").html(K2510_html);
    }
    poll_update_k2510_elements();
}

//periodically calls a function to update k2410 elements
function poll_update_k2410_elements(){
    handle_k2410_update();
   setTimeout(poll_update_k2410_elements, 500)
}

//periodically calls a function to update k2510 elements
function poll_update_k2510_elements() {
    handle_k2510_update();
    setTimeout(poll_update_k2510_elements, 500);
}

//performs the get for each k2410 and passes a function to "update_k2410_elements"
function handle_k2410_update(){
    for (let x in K2410_devices) {
        var id = K2410_devices[x];
        $.getJSON('/api/' + api_version + '/gpib/devices/' + id, update_k2410_elements(id));
    }    
}

function update_k2410_elements(id) {
    return function(response) {
        (document.getElementById("enable-toggle-"+id)).checked = (response[id].device_control_state);
        (document.getElementById("output-toggle-"+id)).checked = (response[id].output_state);
        // Section of code runs for each K2410 device when the page is loaded
        if (up_i<(K2410_devices.length)){
            //Sets the inital state of the dropdowns so that they are in sync with the adapter state
            $("#volt-set-range-"+id).val(parseFloat(response[id].voltage.voltage_curr_range))
            if ((response[id].filter.filter_state)=="Enabled"){
                $("#filt-set-state-"+id).val("1")
            } else if ((response[id].filter.filter_state)=="Disabled"){
                $("#filt-set-state-"+id).val("0")
            }            
            if ((response[id].filter.filter_curr_type)=="Repeating"){
                $("#filt-set-type-"+id).val("REP")
            } else if ((response[id].filter.filter_curr_type)=="Moving"){
                $("#filt-set-type-"+id).val("MOV")
            }
            up_i += 1 
        }  

         if (response[id].ramping_flag == true){
            document.getElementById('vr_cancel-'+id).style.display = '';
            document.getElementById("vlr_set-"+id).disabled = true;
            document.getElementById("ramping-toggle-"+id).disabled = true;
            document.getElementById("volt-set-range-"+id).disabled = true;
        } else {
            document.getElementById('vr_cancel-'+id).style.display = 'none';
            document.getElementById("vlr_set-"+id).disabled = false;
            document.getElementById("ramping-toggle-"+id).disabled = false;
            document.getElementById("volt-set-range-"+id).disabled = false;
        }           
        
        if (response[id].output_state){
            $("#out-state-"+id).html("Enabled");
        } else {
            $("#out-state-"+id).html("Disabled")
        }

        K2410_output_list = ["#filt-state-","#filt-curr-count-","#filt-curr-type-","#volt-meas-","#volt-curr-range-",
                            "#curr-meas-","#curr-comp-meas-","#out-state-"];
        K2410_input_list = ["filt-set-type-","filt-set-state-","filt-set-count-","volt-set-level-",
                           "vl_set-","curr-set-comp-","cc_set-","fc_set-","output-toggle-"]
        var enabled = $('#enable-toggle-'+id).prop('checked');

        if (enabled == false){
            for(x in K2410_output_list){
                $(K2410_output_list[x]+id).html("--");            
            }
            for(x in K2410_input_list){
                document.getElementById(K2410_input_list[x]+id).disabled = true;
            } 
            document.getElementById('volt-set-range-'+id).disabled = true;
            document.getElementById('vlr_set-'+id).disabled = true;
        } else {
            for(x in K2410_input_list){
                document.getElementById(K2410_input_list[x]+id).disabled = false;
            }
            $("#filt-state-"+id).html(response[id].filter.filter_state);
            $("#filt-curr-count-"+id).html(response[id].filter.filter_curr_count);
            $("#filt-curr-type-"+id).html(response[id].filter.filter_curr_type);
            $("#volt-meas-"+id).html((response[id].voltage.voltage_measurement).toFixed(4));
            $("#volt-curr-range-"+id).html(response[id].voltage.voltage_curr_range);
            $("#curr-comp-meas-"+id).html(toSiUnit(response[id].current.current_curr_comp));
            //var curr_meas =(response[id].current.current_measurement);
            //console.log(curr_meas,typeof(curr_meas))
            $("#curr-meas-"+id).html(toSiUnit(response[id].current.current_measurement));
        }
    }
}

function toSiUnit(num){
    numin = num
    pow = [-15,-12,-9,-6,-3,0]
    siUnit = ['f','p','n','μ','m','']
    i=5
    isNegative = numin < 0;
    if (isNegative) {
        numin = -numin;
    }
    testnum = (numin / (Math.pow(10,pow[i])))
    while ( testnum < 1){
        i = i -1
        testnum = (numin / (Math.pow(10,pow[i])))
    }
    if (isNegative) {
        return(('-'+testnum.toFixed(2))+' '+siUnit[i]+'A')
    } else{
        return((testnum.toFixed(2))+' '+siUnit[i]+'A')
    }
}

//puts the value of the toggle switch into the devices parameter tree
function set_enable_k2410(id) {
    var enabled = $('#enable-toggle-'+id).prop('checked');
    ajax_put(id,'device_control_state',enabled)
}

function set_output_k2410(id) {
    var toggle = $('#output-toggle-'+id).prop('checked');
    ajax_put(id,'output_state',toggle)
}

function set_ramping_k2410(id) {
    var enabled = $('#ramping-toggle-'+id).prop('checked');
    if (enabled == true){
        document.getElementById('row1-'+id).style.display = 'none';
        document.getElementById('row2-'+id).style.display = '';
        document.getElementById('row3-'+id).style.display = '';
    } else{
        document.getElementById('row1-'+id).style.display = '';
        document.getElementById('row2-'+id).style.display = 'none';
        document.getElementById('row3-'+id).style.display = 'none';
    }
}

function cancel_ramp(id){
    var value = false
    ajax_put(id,'ramping_flag',value)
}

function handle_k2510_update(){
    for (let x in K2510_devices) {
        var id = K2510_devices[x];
        $.getJSON('/api/' + api_version + '/gpib/devices/' + id, update_k2510_elements(id));
    } 
}

function update_k2510_elements(id) {
    return function(response) {

        (document.getElementById("enable-toggle-"+id)).checked = (response[id].device_control_state);
        (document.getElementById("output-toggle-"+id)).checked = (response[id].output_state);

        if (response[id].output_state){
            $("#tec-out-state-"+id).html("Enabled");
        } else {
            $("#tec-out-state-"+id).html("Disabled")
        }
        
        if (response[id].temp_over_state){
            document.getElementById('reset-temp-'+id).style.display = '';
        } else {
            document.getElementById('reset-temp-'+id).style.display = 'none';
        }

        K2510_output_list = ["#tec-power-meas-","#curr-temp-meas-","#tec-volt-meas-","#tec-current-meas-","#tec-set-point-","#tec-out-state-"]; 
        K2510_input_list = ["curr-set-limit-","volt-set-limit-","c_lim_set-","v_lim_set-","temp-set-level-","tp_set-","output-toggle-"];
        var enabled = $('#enable-toggle-'+id).prop('checked');

        if (enabled == false){
            for(x in K2510_output_list){
                $(K2510_output_list[x]+id).html("--");            
            }
            for(x in K2510_input_list){
                document.getElementById(K2510_input_list[x]+id).disabled = true;
            }
        } else {
            for(x in K2510_input_list){
                document.getElementById(K2510_input_list[x]+id).disabled = false;
            }
            $("#tec-power-meas-"+id).html((parseFloat(response[id].info.tec_power).toFixed(3)));
            $("#curr-temp-meas-"+id).html((parseFloat(response[id].info.tec_temp_meas).toFixed(3)));
            $("#tec-volt-meas-"+id).html((parseFloat(response[id].info.tec_voltage).toFixed(3)));
            $("#tec-current-meas-"+id).html((parseFloat(response[id].info.tec_current).toFixed(3)));
            $("#tec-set-point-"+id).html((parseFloat(response[id].info.tec_setpoint).toFixed(3)));
        }
    }
}

function set_enable_k2510(id){
    var enabled = $('#enable-toggle-'+id).prop('checked');
    ajax_put(id,'device_control_state',enabled)
}

//Obtains the entered voltage level value, performs validation and sends it to the 
//adapter program if it meets the input criteria 
function set_voltage_level(element_id,id){
    var v_input_box = (document.getElementById(element_id))
    var regexVolt = /^-?\d+(\.\d{1,3})?$/;

    if (regexVolt.test(v_input_box.value)){
        $.getJSON('/api/' + api_version + '/gpib/devices/' + id + '/voltage', function(response) {
        voltage_validation_check(v_input_box,response.voltage.voltage_curr_range)
    var voltage = parseFloat(document.getElementById('volt-set-level-'+id).value);
    ajax_put(id+'/voltage','voltage_set',voltage) });        
    } else {
        v_input_box.value = "";
    }
}

function set_voltage_ramp_level(volt_id,time_id,id){
    var vr_input_box = (document.getElementById(volt_id))
    var tr_input_box = (document.getElementById(time_id))
    var regexVolt = /^-?\d+(\.\d{1,3})?$/;
    var regexTime = /^\d+$/;

    if (regexVolt.test(vr_input_box.value) && regexTime.test(tr_input_box.value)){
        $.getJSON('/api/' + api_version + '/gpib/devices/' + id, function(response) {

        voltage_validation_check(vr_input_box,response[id].voltage.voltage_curr_range)

        if (tr_input_box.value < 1){ tr_input_box.value = 1;}
        if (tr_input_box.value > 600){ tr_input_box.value = 600;}

        var voltage = parseFloat(document.getElementById(volt_id).value);
        var time = parseInt(document.getElementById(time_id).value);

        $.ajax({
            type: "PUT",
            url: '/api/' + api_version + '/gpib/devices/' + id + '/voltage',
            contentType: "application/json",
            data: JSON.stringify({'voltage_time': time}), 
            success: function(data){
                $.ajax({
                    type: "PUT",
                    url: '/api/' + api_version + '/gpib/devices/' + id + '/voltage',
                    contentType: "application/json",
                    async: false,
                    data: JSON.stringify({'voltage_ramp_set': voltage})});
            }});
    })
    } else {
        vr_input_box.value = "";
        tr_input_box.value = "";
    }
}

function voltage_validation_check(input_box,range){
    if (range == 0.21){
        if (input_box.value < -0.21){input_box.value = -0.21;}
        if (input_box.value > 0.21) {input_box.value = 0.21;}
    } 
    if (range == 2.10){
        if (input_box.value < -2.1){input_box.value = -2.1;}
        if (input_box.value > 2.1) {input_box.value = 2.1;}
    }
    if (range == 21.00){
        if (input_box.value < -21){input_box.value = -21;}
        if (input_box.value > 21) {input_box.value = 21;}
    }
    if (range == 1100){
        if (input_box.value < -1100){input_box.value = -1100;}
        if (input_box.value > 1100) {input_box.value = 1100;}
    }
}

//sets the voltage range from on a value selected from a dropdown 
function set_voltage_range(id){
    var r_in = document.getElementById('volt-set-range-'+ id).value;
    ajax_put(id+'/voltage','voltage_range',r_in)
}

//obtains the entered compliance current value, performs validation and sends it to the
//adapter program if it meets the input criteria
function set_current_comp(element_id,id){
    var c_input_box = (document.getElementById(element_id))
    var regexCurr = /^\d+(\.\d{1,3})?$/;
    if (regexCurr.test(c_input_box.value)){
        if (c_input_box.value > 1000){c_input_box.value = 1000}
        var curr_comp = parseFloat(document.getElementById('curr-set-comp-'+id).value);
        ajax_put(id+'/current','current_comp_set',curr_comp)
    } else {
        c_input_box.value = "";
    }
}

//obtains the entered filter count value, performs validation and sends it to the
//adapter program if it meets the input criteria
function set_filter_count(element_id,id){
    var f_input_box = (document.getElementById(element_id))
    var regexVolt = /^\d+$/;

    if (regexVolt.test(f_input_box.value)){
        $.getJSON('/api/' + api_version + '/gpib/devices/' + id + '/filter', function(response) {
            var filt_curr_type = response.filter.filter_curr_type;
            if (filt_curr_type.includes("Moving")){
                if (f_input_box.value < 1){ f_input_box.value = 1;}
                if (f_input_box.value > 100){ f_input_box.value = 100;}
            }
            if (filt_curr_type.includes("Repeating")) {
                if (f_input_box.value < 1){ f_input_box.value = 1;}
                if (f_input_box.value > 10){ f_input_box.value = 10;}
            }      
            var filt_count = parseInt(document.getElementById('filt-set-count-'+id).value);
            ajax_put(id+'/filter','filter_count',filt_count) })
    } else {
        f_input_box.value = "";
    }
}

//obtains the most up to date value of the filter state in the parameter tree
function set_filter_state(id){
    var fs_in = document.getElementById('filt-set-state-'+id).value;
    ajax_put(id+'/filter','filter_enable',fs_in)
}

//obtains the most up to date value of the filter type in the paramter tree
function set_filter_type(id){
    var ft_in = document.getElementById('filt-set-type-'+id).value;
    if (ft_in === "REP"){
        var curr_count = document.getElementById('filt-curr-count-'+id).innerHTML;
        if (curr_count > 10){
            var filt_count = 10;
            ajax_put(id+'/filter','filter_count',filt_count)
            };
        }
    ajax_put(id+'/filter','filter_type',ft_in)
}

/////////////////////////  K2510 Functions  /////////////////////////////

function set_current_limit(element_id,id){
    var input_box = (document.getElementById(element_id));
    var regexCurr = /^-?\d+(\.\d{1,3})?$/;
    if (regexCurr.test(input_box.value)){    
        var curr_lim = parseFloat(document.getElementById('curr-set-limit-'+id).value);
        ajax_put(id+'/set','c_lim_set',curr_lim)
    } else {
        input_box.value = "";
    }        
}

function set_voltage_limit(element_id,id){
    var input_box = (document.getElementById(element_id));
    var regexCurr = /^-?\d+(\.\d{1,3})?$/;
    if (regexCurr.test(input_box.value)){
        var volt_lim = parseFloat(document.getElementById('volt-set-limit-'+id).value);
        ajax_put(id+'/set','v_lim_set',volt_lim) 
    } else {
        input_box.value = "";
    }       
}

function set_temp_level(element_id,id){
    var input_box = (document.getElementById(element_id));
    var regexCurr = /^-?\d+(\.\d{1,3})?$/;
    if (regexCurr.test(input_box.value)){        
        var temp = parseFloat(document.getElementById('temp-set-level-'+id).value);
        ajax_put((id+'/set/'),'temp_set',temp);
    } else {
        input_box.value = "";
    }     
}

function set_output_k2510(id){
    var toggle = $('#output-toggle-'+id).prop('checked');
    ajax_put(id,'output_state',toggle);
}

function set_over_temp(id){
    var value = false
    ajax_put(id,'temp_over_state',value);
}

function ajax_put(path,key,value){
    let data = {};
    data[key] = value;
    console.log(data,"data in ajax_put",JSON.stringify(data))
    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + path,
        contentType: "application/json",
        data: JSON.stringify(data),
    });
}