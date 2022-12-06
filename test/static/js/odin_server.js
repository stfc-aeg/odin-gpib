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
                    Enable control
                    </label>
                    <label class = "switch">
                    <input type="checkbox" onclick="set_enable_k2410('${id}')" id="enable-toggle-${id}">
                    <span class="slider"> </span>
                    </label>   
                </div>
                <div>
                    <label class = "switch-label" for = "output-toggle-${id}">
                    Enable output
                    </label>
                    <label class = "switch">                        
                    <input class type="checkbox" onclick="set_output_k2410('${id}')" id="output-toggle-${id}">
                    <span class="slider"> </span>
                    </label>                           
                </div>
                <div>
                    <label class = "switch-label" for = "ramping-toggle-${id}">
                    Enable ramping
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
                    <input type = "button" id="vl_set-${id}" value="Set" onclick="set_voltage_ramp_level('volt-ramp-set-level-${id}','time-to-set-${id}','${id}')" />
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
                <td> <span id="curr-meas-${id}"></span>                
                <select id = "curr-meas-pow-${id}" onChange="set_curr_meas_pow('${id}')">
                <option value = "1">A </option>
                <option value = "3">mA (mili)</option>
                <option value = "6">uA (micro)</option>
                <option value = "9">nA (nano)</option>
                <option value = "12">pA (pico)</option>
                <option value = "15">fA (femto)</option>                
            </select> 
                
                </td>
                
            </tr>
            <tr>
                <th> Compliance current: </th>
                <td> <span id="curr-comp-meas-${id}"></span> A</td>
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
        //console.log(K2410_html)
        //set_ramping_inital(id)
        
    }
    
    for (let x in K2410_devices) {
        var id = K2410_devices[x];
        set_ramping_inital(id)
    }
    
    poll_update_k2410_elements();
}

function set_curr_meas_pow(id){
    var pow = parseInt(document.getElementById('curr-meas-pow-'+id).value);
    console.log(pow,typeof(pow))
    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + id + '/current',
        contentType: "application/json",
        data: JSON.stringify({'current_meas_pow': pow}),
    });
}

function set_ramping_inital(id){
    console.log("ID after wiritng html to div"+id)
    document.getElementById('row1-'+id).style.display = '';
    console.log('row1-'+id)
    document.getElementById('row2-'+id).style.display = 'none';
    console.log('row2-'+id)
    document.getElementById('row3-'+id).style.display = 'none';
    console.log('row3-'+id)
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
                    Enable control
                    </label>
                    <label class = "switch">
                        <input type="checkbox" onclick="set_enable_k2510('${id}')" id="enable-toggle-${id}">
                        <span class="slider"> </span>
                    </label>    
                </div>

                <div>
                    <label class = "switch-label" for = "output-toggle-${id}">
                    Enable output
                    </label>
                    <label class = "switch">                        
                    <input type="checkbox" onclick="set_output_k2510('${id}')" id="output-toggle-${id}">
                    <span class="slider"> </span>
                    </label>                           
                </div>
                    <div>
                          
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
                <th> Set upper temp limit:  </th>
                <td>         
                    <form>
                        <label for ="temp-set-upper-${id}"> Upper temp: </label>
                        <input id="temp-set-upper-${id}" type="text"/>
                        <input type = "button" id="tu_set-${id}" value="Set" onclick="set_up_temp_level('temp-set-upper-${id}','${id}')" />
                    </form> 
                </td>
            </tr>
            <tr>
            <th> Set lower temp limit:  </th>
            <td>         
                <form>
                    <label for ="temp-set-lower-${id}"> Lower temp: </label>
                    <input id="temp-set-lower-${id}" type="text"/>
                    <input type = "button" id="tl_set-${id}" value="Set" onclick="set_down_temp_level('temp-set-lower-${id}','${id}')" />
                </form> 
            </td>
            </tr>
            </tr>
            <tr>
            <th> Set temp level:  </th>
            <td>         
                <form>
                    <label for ="temp-set-level-${id}"> Temp point: </label>
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

function set_init_k2410_values(id) {

}

function update_k2410_elements(id) {
    return function(response) {
        var enabled = $('#enable-toggle-'+id).prop('checked');

        if (up_i<(K2410_devices.length)){
 
            $("#volt-set-range-"+id).val(parseFloat(response[id].voltage.voltage_curr_range))
            $("#curr-meas-pow-"+id).val(response[id].current.current_meas_pow)
            if ((response[id].filter.filter_state)=="Enabled"){
                console.log(id,"Enabled filter")
                $("#filt-set-state-"+id).val("1")
            } else if ((response[id].filter.filter_state)=="Disabled"){
                console.log(id,"Disabled filter")
                $("#filt-set-state-"+id).val("0")
            } else {
                console.log(id,"unkown filter state")
            }            
            if ((response[id].filter.filter_curr_type)=="Repeating"){
                console.log(id,"repeating filter")
                $("#filt-set-type-"+id).val("REP")
            } else if ((response[id].filter.filter_curr_type)=="Moving"){
                console.log(id,"moving filter")
                $("#filt-set-type-"+id).val("MOV")
            } else {
                console.log(id,"unkown filter type")
            }
            up_i += 1 
        }                
        
        var retrieved_output_state = (response[id].output_state);
        if (retrieved_output_state == true){
            $("#out-state-"+id).html("Enabled");
        } else {
            $("#out-state-"+id).html("Disabled")
        }

        $("#filt-state-"+id).html(response[id].filter.filter_state);
        $("#filt-curr-count-"+id).html(response[id].filter.filter_curr_count);
        $("#filt-curr-type-"+id).html(response[id].filter.filter_curr_type);
        $("#volt-meas-"+id).html((response[id].voltage.voltage_measurement).toFixed(4))
        $("#volt-curr-range-"+id).html(response[id].voltage.voltage_curr_range);
        $("#curr-comp-meas-"+id).html(response[id].current.current_curr_comp);       

        var curr_meas =(response[id].current.current_measurement);
        var pow = (response[id].current.current_meas_pow); 
        $("#curr-meas-"+id).html((curr_meas *(Math.pow(10,pow))).toFixed(4));

        document.getElementById('filt-set-type-'+id).disabled = false;
        document.getElementById('filt-set-state-'+id).disabled = false;
        document.getElementById('filt-set-count-'+id).disabled = false;
        document.getElementById('volt-set-range-'+id).disabled = false;
        document.getElementById('volt-set-level-'+id).disabled = false;
        document.getElementById('vl_set-'+id).disabled = false; 
        document.getElementById('curr-set-comp-'+id).disabled = false; 
        document.getElementById('cc_set-'+id).disabled = false;
        document.getElementById('fc_set-'+id).disabled = false;        
        document.getElementById("output-toggle-"+id).disabled = false;
        (document.getElementById("enable-toggle-"+id)).checked = (response[id].device_control_state);
        (document.getElementById("output-toggle-"+id)).checked = (response[id].output_state);
        
        
        if (enabled == false){
            $("#filt-state-"+id).html("--");
            $("#filt-curr-count-"+id).html("--");        
            $("#filt-curr-type-"+id).html("--"); 
            $("#volt-meas-"+id).html("--");
            $("#volt-curr-range-"+id).html("--"); 
            $("#curr-meas-"+id).html("--");
            $("#curr-comp-meas-"+id).html("--");
            $("#out-state-"+id).html("--")
            document.getElementById('filt-set-type-'+id).disabled = true;
            document.getElementById('filt-set-state-'+id).disabled = true;
            document.getElementById('filt-set-count-'+id).disabled = true;
            document.getElementById('volt-set-range-'+id).disabled = true;
            document.getElementById('volt-set-level-'+id).disabled = true;
            document.getElementById('vl_set-'+id).disabled = true; 
            document.getElementById('curr-set-comp-'+id).disabled = true; 
            document.getElementById('cc_set-'+id).disabled = true;
            document.getElementById('fc_set-'+id).disabled = true;
            document.getElementById("output-toggle-"+id).disabled = true;       
        }
    }
}

//puts the value of the toggle switch into the devices parameter tree
function set_enable_k2410(id) {
    var enabled = $('#enable-toggle-'+id).prop('checked');
    console.log("Setting enabled for " + id + " to " + enabled);
    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + id,
        contentType: "application/json",
        data: JSON.stringify({'device_control_state': enabled}),
    });
}

function set_output_k2410(id) {
    var toggle = $('#output-toggle-'+id).prop('checked');
    console.log("Output toggle for " + id + " set to " + toggle);
    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + id,
        contentType: "application/json",
        data: JSON.stringify({'output_state': toggle}),
    });
}

function set_ramping_k2410(id) {
    var enabled = $('#ramping-toggle-'+id).prop('checked');
    if (enabled == true){
        document.getElementById('row1-'+id).style.display = 'none';
        document.getElementById('row2-'+id).style.display = '';
        document.getElementById('row3-'+id).style.display = '';
        console.log("Enable ramping");
    } else{
        document.getElementById('row1-'+id).style.display = '';
        document.getElementById('row2-'+id).style.display = 'none';
        document.getElementById('row3-'+id).style.display = 'none';
        console.log("Disable ramping");
    }
}

function handle_k2510_update(){
    for (let x in K2510_devices) {
        var id = K2510_devices[x];
        $.getJSON('/api/' + api_version + '/gpib/devices/' + id, update_k2510_elements(id));
    } 
}

function update_k2510_elements(id) {
    return function(response) {
        var retrieved_output_state = (response[id].output_state);
        if (retrieved_output_state == true){
            $("#tec-out-state-"+id).html("Enabled");
        } else {
            $("#tec-out-state-"+id).html("Disabled")
        }
        var enabled = $('#enable-toggle-'+id).prop('checked');
        $("#tec-power-meas-"+id).html(response[id].info.tec_power);
        $("#curr-temp-meas-"+id).html(response[id].info.tec_temp_meas);
        $("#tec-volt-meas-"+id).html(response[id].info.tec_voltage);
        $("#tec-current-meas-"+id).html(response[id].info.tec_current);
        $("#tec-set-point-"+id).html(response[id].info.tec_setpoint);

        document.getElementById('temp-set-upper-'+id).disabled = false;
        document.getElementById('tu_set-'+id).disabled = false;
        document.getElementById('temp-set-lower-'+id).disabled = false;
        document.getElementById('tl_set-'+id).disabled = false;
        document.getElementById('temp-set-level-'+id).disabled = false;
        document.getElementById('tp_set-'+id).disabled = false; 
        document.getElementById("output-toggle-"+id).disabled = false;
        (document.getElementById("enable-toggle-"+id)).checked = (response[id].device_control_state);
        (document.getElementById("output-toggle-"+id)).checked = (response[id].output_state);
        
        if (enabled == false){
            $("#tec-power-meas-"+id).html("--");
            $("#curr-temp-meas-"+id).html("--");
            $("#tec-volt-meas-"+id).html("--");
            $("#tec-current-meas-"+id).html("--");
            $("#tec-set-point-"+id).html("--");
            $("#tec-out-state-"+id).html("--");
           
            document.getElementById('temp-set-upper-'+id).disabled = true;
            document.getElementById('tu_set-'+id).disabled = true;
            document.getElementById('temp-set-lower-'+id).disabled = true;
            document.getElementById('tl_set-'+id).disabled = true;
            document.getElementById('temp-set-level-'+id).disabled = true;
            document.getElementById('tp_set-'+id).disabled = true; 
            document.getElementById("output-toggle-"+id).disabled = true;
        } 
    }
}

function set_enable_k2510(id){
    var enabled = $('#enable-toggle-'+id).prop('checked');
    console.log("Setting enabled for " + id + " to " + enabled);
    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + id,
        contentType: "application/json",
        data: JSON.stringify({'device_control_state': enabled}),
    });
}

//Obtains the entered voltage level value, performs validation and sends it to the 
//adapter program if it meets the input criteria 
function set_voltage_level(element_id,id){
    var v_input_box = (document.getElementById(element_id))
    var regexVolt = /^-?\d+(\.\d{1,3})?$/;

    if (regexVolt.test(v_input_box.value)){
        $.getJSON('/api/' + api_version + '/gpib/devices/' + id + '/voltage', function(response) {

        var volt_curr_range = response.voltage.voltage_curr_range;
        console.log(volt_curr_range);
        if (volt_curr_range == 0.21){
            if (v_input_box.value < -0.21){ v_input_box.value = -0.21;}
            if (v_input_box.value > 0.21) {v_input_box.value = 0.21;}
        } 
        if (volt_curr_range == 2.10){
            if (v_input_box.value < -2.1){ v_input_box.value = -2.1;}
            if (v_input_box.value > 2.1) {v_input_box.value = 2.1;}
        }
        if (volt_curr_range == 21.00){
            if (v_input_box.value < -21){ v_input_box.value = -21;}
            if (v_input_box.value > 21) {v_input_box.value = 21;}
        }
        if (volt_curr_range == 1100){
            if (v_input_box.value < -1100){ v_input_box.value = -1100;}
            if (v_input_box.value > 1100) {v_input_box.value = 1100;}
        }

    var v_in = document.getElementById('volt-set-level-'+id).value;
    var voltage = parseFloat(v_in);

    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + id + '/voltage',
        contentType: "application/json",
        data: JSON.stringify({'voltage_set': voltage})  }); 
    });        
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
        console.log("test passed");
        $.getJSON('/api/' + api_version + '/gpib/devices/' + id, function(response) {

        var volt_curr_range = response[id].voltage.voltage_curr_range;
        console.log(volt_curr_range);
        if (volt_curr_range == 0.21){
            if (vr_input_box.value < -0.21){ vr_input_box.value = -0.21;}
            if (vr_input_box.value > 0.21) {vr_input_box.value = 0.21;}
        } 
        if (volt_curr_range == 2.10){
            if (vr_input_box.value < -2.1){ vr_input_box.value = -2.1;}
            if (vr_input_box.value > 2.1) {vr_input_box.value = 2.1;}
        }
        if (volt_curr_range == 21.00){
            if (vr_input_box.value < -21){ vr_input_box.value = -21;}
            if (vr_input_box.value > 21) {vr_input_box.value = 21;}
        }
        if (volt_curr_range == 1100){
            if (vr_input_box.value < -1100){ vr_input_box.value = -1100;}
            if (vr_input_box.value > 1100) {vr_input_box.value = 1100;}
        }

        if (tr_input_box.value < 1){ tr_input_box.value = 1;}
        if (tr_input_box.value > 600){ tr_input_box.value = 600;}

        var voltage = parseFloat(document.getElementById(volt_id).value);
        var time = parseInt(document.getElementById(time_id).value);

        console.log(voltage, time)
        console.log(voltage,time);
        console.log("Sending time")
        $.ajax({
            type: "PUT",
            url: '/api/' + api_version + '/gpib/devices/' + id + '/voltage',
            contentType: "application/json",
            data: JSON.stringify({'voltage_time': time}), 
            success: function(data){
                console.log("sent time")
                console.log("sending voltage")
                $.ajax({
                    type: "PUT",
                    url: '/api/' + api_version + '/gpib/devices/' + id + '/voltage',
                    contentType: "application/json",
                    async: false,
                    data: JSON.stringify({'voltage_ramp_set': voltage}) , 
                    success: function(data){
                        console.log("sent voltage")
                    }});
            }});
    })
    } else {
        vr_input_box.value = "";
        tr_input_box.value = "";
        console.log("test failed");
    }
}

//sets the voltage range from on a value selected from a dropdown 
function set_voltage_range(id){
    var r_in = document.getElementById('volt-set-range-'+ id).value;

    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + id + '/voltage',
        contentType: "application/json",
        data: JSON.stringify({'voltage_range': r_in})
    });
}

//obtains the entered compliance current value, performs validation and sends it to the
//adapter program if it meets the input criteria
function set_current_comp(element_id,id){
    var c_input_box = (document.getElementById(element_id))
    var regexCurr = /^\d+(\.\d{1,3})?$/;
    if (regexCurr.test(c_input_box.value)){
        if (c_input_box.value > 1000){c_input_box.value = 1000}
        var cc_in = document.getElementById('curr-set-comp-'+id).value;
        var curr_comp = parseFloat(cc_in);
        $.ajax({
            type: "PUT",
            url: '/api/' + api_version + '/gpib/devices/' + id + '/current',
            contentType: "application/json",
            data: JSON.stringify({'current_comp_set': curr_comp})
        });
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
            var fc_in = document.getElementById('filt-set-count-'+id).value;
            var filt_count = parseInt(fc_in);

            $.ajax({
                type: "PUT",
                url: '/api/' + api_version + '/gpib/devices/' + id + '/filter',
                contentType: "application/json",
                data: JSON.stringify({'filter_count': filt_count})
                })
    })
    } else {
        f_input_box.value = "";
    }
}

//obtains the most up to date value of the filter state in the parameter tree
function set_filter_state(id){
    var fs_in = document.getElementById('filt-set-state-'+id).value;

    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + id + '/filter',
        contentType: "application/json",
        data: JSON.stringify({'filter_enable': fs_in}) 
    })
}

//obtains the most up to date value of the filter type in the paramter tree
function set_filter_type(id){
    var ft_in = document.getElementById('filt-set-type-'+id).value;
    if (ft_in === "REP"){
        var curr_count = document.getElementById('filt-curr-count-'+id).innerHTML;
        if (curr_count > 10){
            var filt_count = 10;
            $.ajax({
                type: "PUT",
                url: '/api/' + api_version + '/gpib/devices/' + id + '/filter',
                contentType: "application/json",
                data: JSON.stringify({'filter_count': filt_count})
                });
            };
        }
    
    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + id + '/filter',
        contentType : "application/json", 
        data: JSON.stringify({'filter_type': ft_in})
    })
}

/////////////////////////  K2510 Functions  /////////////////////////////

function set_up_temp_level(element_id,id){
    var input_box = (document.getElementById(element_id));
    var regexCurr = /^-?\d+(\.\d{1,3})?$/;
    if (regexCurr.test(input_box.value)){    
        var v_in = document.getElementById('temp-set-upper-'+id).value;
        var temp_up = parseFloat(v_in);

        $.ajax({
            type: "PUT",
            url: '/api/' + api_version + '/gpib/devices/' + id + '/temp',
            contentType: "application/json",
            data: JSON.stringify({'temp_up_limit': temp_up})  });
    } else {
        input_box.value = "";
    }        
}

function set_down_temp_level(element_id,id){
    var input_box = (document.getElementById(element_id));
    var regexCurr = /^-?\d+(\.\d{1,3})?$/;
    if (regexCurr.test(input_box.value)){
        var v_in = document.getElementById('temp-set-lower-'+id).value;
        var temp_down = parseFloat(v_in);

        $.ajax({
            type: "PUT",
            url: '/api/' + api_version + '/gpib/devices/' + id + '/temp',
            contentType: "application/json",
            data: JSON.stringify({'temp_down_limit': temp_down})  }); 
    } else {
        input_box.value = "";
    }       
}

function set_temp_level(element_id,id){
    var input_box = (document.getElementById(element_id));
    var regexCurr = /^-?\d+(\.\d{1,3})?$/;
    if (regexCurr.test(input_box.value)){
        //if (input_box.value > ) {input_box.value = 1000};
        var v_in = document.getElementById('temp-set-level-'+id).value;
        var temp = parseFloat(v_in);
        $.ajax({
            type: "PUT",
            url: '/api/' + api_version + '/gpib/devices/' + id + '/temp',
            contentType: "application/json",
            data: JSON.stringify({'temp_set': temp})  }); 
    } else {
        input_box.value = "";
    }     
}

function set_output_k2510(id) {
    var toggle = $('#output-toggle-'+id).prop('checked');
    console.log("Output toggle for " + id + " set to " + toggle);
    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + id,
        contentType: "application/json",
        data: JSON.stringify({'output_state': toggle}),
    });
}
