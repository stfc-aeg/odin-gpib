api_version = '0.1';
// id_list = ["K2410_24","K2410_12","K2410_11", "K2510_15","K2510_16","K2510_20","K2420_14"];
id_list = [];
K2410_devices = [];
K2510_devices = [];

//runs when the script is loaded
$( document ).ready(function() {
    update_api_version();
    update_api_adapters();
    update_detected_devices();
});

//periodically calls a function to update k2410 elements 
function poll_update_k2410_elements(){
    update_k2410_elements();
    setTimeout(poll_update_k2410_elements, 500)
}
//periodically calls a function to update k2510 elements
function poll_update_K2510_elements() {
    update_k2510_elements();
    setTimeout(poll_update_K2510_elements, 500);
}

//gets the most up to date api version
function update_api_version() {

    $.getJSON('/api', function(response) {
        $('#api-version').html(response.api);
        api_version = response.api;
    });
}

//interrogates the parameter tree to get the current list of connected GPIB devices
function update_detected_devices() {
    $.getJSON('/api/' + api_version + '/gpib/', function(response) {
        id_list = response.device_ids;
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
}   create_K2410_interfaces();
    create_K2510_interfaces();
}

//iterates through the list of K2410 devices and generates a new div containing the controls for that
//device, all the html id's are generated using the ID of the device to uniquely identify them and relate
//them back to that device, so they can be addressed by the rest of the program.
function create_K2410_interfaces(){
    var K2410_html = "";
    for (let x in K2410_devices) {
        var curr_id = K2410_devices[x];        
        K2410_html += `
        <div class = "instrument-panel">
        <div class = "device-label">
            <div class = "container-fluid">
                <div> Keithley 2410 power supply: ${curr_id}</div>
                    <div>
                        <label class = "switch">
                        <input type="checkbox" onclick="set_enable_K2410('${curr_id}')" id="task-enable-${curr_id}">
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
                <td> <span id="filt-state-${curr_id}"></span></td>
            </tr>
            <tr>
                <th> Selected filter type: </th>
                <td> <span id="filt-curr-type-${curr_id}"></span></td>
            </tr>
            <tr>
                <th> Selected filter length: </th>
                <td> <span id="filt-curr-count-${curr_id}"></span> values stored for filter</td>
            </tr>
            <tr>
                <th> Set filter type:  </th>
                <td>
                    <label for "filt-set-type-${curr_id}" class= "dropdown">Mode: </label>
                    <select id = "filt-set-type-${curr_id}" onChange="set_filter_type('${curr_id}')">
                        <option value="" selected disabled hidden>Select mode</option>
                        <option value = "MOV">Moving filter</option>
                        <option value = "REP">Repeating filter</option> 
                    </select>                              
                </td>
            </tr>
            <tr>
                <th> Set filter length:  </th>
                <td> 
                    <form>
                        <label for ="filt-set-count-${curr_id}"> Enter filter length</label>
                        <input id="filt-set-count-${curr_id}" type="text"/>
                        <input type="button" id="fc_set-${curr_id}" value="Set" onclick="set_filter_count('filt-set-count-${curr_id}','${curr_id}')"/>
                    </form>
                </td>
            </tr>
            <tr>
                <th> Enable filter:  </th>
                <td>                 
                    <label for "filt-set-state-${curr_id}" class= "dropdown">State: </label>
                    <select id = "filt-set-state-${curr_id}" onChange="set_filter_state('${curr_id}')">
                        <option value="" selected disabled hidden>Toggle enable</option>
                        <option value = "1">Enable filter</option>
                        <option value = "0">Disable filter</option> 
                    </select> 
                </td>
            </tr>
        </tbody>
        </table>
        </div>

        <div class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Voltage measured: </th>
                <td> <span id="volt-meas-${curr_id}"></span> V</td>
            </tr>
            <tr>
                <th> Selected voltage range: </th>
                <td> <span id="volt-curr-range-${curr_id}"></span> V (Maximum +/-)</td>
            </tr>
            <tr>
                <th> Set voltage level:  </th>
                <td>         
                    <form>
                        <label for ="volt-set-level-${curr_id}"> Voltage: </label>
                        <input id="volt-set-level-${curr_id}" type="text"/>
                        <input type = "button" id="vl_set-${curr_id}" value="Set" onclick="set_voltage_level('volt-set-level-${curr_id}','${curr_id}')" />
                    </form> 
                </td>
            </tr>
            <tr>
                <th> Set voltage range:  </th>
                <td>                     
                    <label for "volt-set-range-${curr_id}" class= "dropdown">Range: </label>
                    <select id = "volt-set-range-${curr_id}" onChange="set_voltage_range('${curr_id}')">
                        <option value="" selected disabled hidden>Select Range</option>
                        <option value = "0.21">mV range</option>
                        <option value = "2.1">2.1V range</option> 
                        <option value = "21">21V range</option>
                        <option value = "1000">KV range</option> 
                    </select> 
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
                <td> <span id="curr-meas-${curr_id}"></span> A</td>
            </tr>
            <tr>
                <th> Compliance current: </th>
                <td> <span id="curr-comp-meas-${curr_id}"></span> A</td>
            </tr>
            <tr>
                <th> Set compliance current:  </th>
                <td>                     
                    <form>
                        <label for ="curr-set-comp-${curr_id}"> Compliance (mA): </label>
                        <input id="curr-set-comp-${curr_id}" type="text"/>
                        <input type = "button" id="cc_set-${curr_id}" value="Set" onclick="set_current_comp('curr-set-comp-${curr_id}','${curr_id}')"/>
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
    poll_update_k2410_elements();
    set_K2410_button_state();

    //below is the cause of enable state going to zero each time page was refreshed.
    //set_enable_K2410(curr_id);
}

//iterates through the list of K2510 devices and generates a new div containing the controls for that
//device, all the html id's are generated using the ID of the device to uniquely identify them and relate
//them back to that device, so they can be addressed by the rest of the program. 
function create_K2510_interfaces(){
    var K2510_html = "";
    for (let x in K2510_devices) {
        var curr_id = K2510_devices[x];        
        K2510_html += `
        <div class = "instrument-panel">
        <div class = "device-label">
            <div class = "container-fluid">
                <div> Keithley 2510 peltier controller: ${curr_id}</div>
                <label class="toggle-switch"> 
                <span class="toggle-switch-label"> Enable Remote control (and functions):  </span>
                <input class="toggle-switch-check" type="checkbox" onclick="change_enable()" id="task-enable">
              </label>
            </div>
        </div>
        <ul class="row">
        <li class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Filter state: </th>
                <td> <span id="id4-${curr_id}"></span> V measured</td>
            </tr>
            <tr>
                <th> Selected filter type: </th>
                <td> <span id="id5-${curr_id}"></span> voltage range</td>
            </tr>
            <tr>
                <th> Selected filter length: </th>
                <td> <span id="id-6${curr_id}"></span> voltage set</td>
            </tr>
            <tr>
                <th> Set filter type:  </th>
                <td> <span id="id7-${curr_id}"></span> range set</td>
            </tr>
            <tr>
                <th> Set filter length:  </th>
                <td> <span id="id7-${curr_id}"></span> range set</td>
            </tr>
            <tr>
                <th> Enable filter:  </th>
                <td> <span id="id7-${curr_id}"></span> range set</td>
            </tr>
        </tbody>
        </table>
        </li>

        <li class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Voltage measured: </th>
                <td> <span id="id-${curr_id}"></span> V measured</td>
            </tr>
            <tr>
                <th> Selected voltage range: </th>
                <td> <span id="id1-${curr_id}"></span> voltage range</td>
            </tr>
            <tr>
                <th> Set voltage level:  </th>
                <td> <span id="id2-${curr_id}"></span> voltage set</td>
            </tr>
            <tr>
                <th> Set voltage range:  </th>
                <td> <span id="id3-${curr_id}"></span> range set</td>
            </tr>
        </tbody>
        </table>
        </li>

        <li class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Current measured: </th>
                <td> <span id="id4-${curr_id}"></span> V measured</td>
            </tr>
            <tr>
                <th> Compliance current: </th>
                <td> <span id="id5-${curr_id}"></span> voltage range</td>
            </tr>
            <tr>
                <th> Set compliance current:  </th>
                <td> <span id="id-6${curr_id}"></span> voltage set</td>
            </tr>
        </tbody>
        </table>
        </li> 


        <li class="column">
        <table class="table table-striped">
        <tbody>
            <tr>
                <th> Current measured: </th>
                <td> <span id="id4-${curr_id}"></span> V measured</td>
            </tr>
            <tr>
                <th> Compliance current: </th>
                <td> <span id="id5-${curr_id}"></span> voltage range</td>
            </tr>
            <tr>
                <th> Set compliance current:  </th>
                <td> <span id="id-6${curr_id}"></span> voltage set</td>
            </tr>
        </tbody>
        </table>
        </li> 
        </ul>
        </div>
        `
        $("#K2510test").html(K2510_html);
    }
    update_k2510_elements();
}

//updates the values of elements in each k2410 interface
function update_k2410_elements(){
    for (let x in K2410_devices) {
        var curr_id = K2410_devices[x];
        var enabled = $('#task-enable-'+curr_id).prop('checked');
        if (enabled == true){
            update_K2410_filter_elements(curr_id);
            update_K2410_voltage_elements(curr_id);
            update_K2410_current_elements(curr_id);
            set_K2410_button_state();        
        } else {
            setTimeout(set_zero(curr_id), 100);    
        }
    }    
}


//updates the filter html elements for a K2410 passed to it 
function update_K2410_filter_elements(curr_id){
    $.getJSON('/api/' + api_version + '/gpib/devices/' + curr_id + '/filter', function(response) {

        var filt_state = response.filter.filter_state;
        $("#filt-state-"+curr_id).html(filt_state);

        var filt_curr_count = response.filter.filter_curr_count;
        $("#filt-curr-count-"+curr_id).html(filt_curr_count);
        
        var filt_curr_type = response.filter.filter_curr_type;
        $("#filt-curr-type-"+curr_id).html(filt_curr_type);
    })
}

//updates the voltage html elements for a K2410 passed to it 
function update_K2410_voltage_elements(curr_id){

    $.getJSON('/api/' + api_version + '/gpib/devices/' + curr_id + '/voltage', function(response) {

        var volt_meas = response.voltage.voltage_measurement;
        $("#volt-meas-"+curr_id).html(volt_meas);

        var volt_curr_range = response.voltage.voltage_curr_range;
        $("#volt-curr-range-"+curr_id).html(volt_curr_range);
    })
}

//updates the currrent html elements for a K2410 passed to it
function update_K2410_current_elements(curr_id){

    $.getJSON('/api/' + api_version + '/gpib/devices/' + curr_id + '/current', function(response) {
       
        var curr_meas = response.current.current_measurement;
        $("#curr-meas-"+curr_id).html(curr_meas);

        var curr_comp_meas = response.current.current_curr_comp;
        $("#curr-comp-meas-"+curr_id).html(curr_comp_meas);

        //var enabled = $('#task-enable-'+curr_id).prop('checked');
    })
}

//resets the values of the elements on screen to better indicate the disabled state
function set_zero(curr_id){
    $("#filt-state-"+curr_id).html("--");
    $("#filt-curr-count-"+curr_id).html("--");        
    $("#filt-curr-type-"+curr_id).html("--"); 
    $("#volt-meas-"+curr_id).html("--");
    $("#volt-curr-range-"+curr_id).html("--"); 
    $("#curr-meas-"+curr_id).html("--");
    $("#curr-comp-meas-"+curr_id).html("--");
}

//enables and disbales the input fields when the instrument control of a k2410 is toggled
function set_enable_K2410(curr_id) {
    var enabled = $('#task-enable-'+curr_id).prop('checked');
    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + curr_id,
        contentType: "application/json",
        data: JSON.stringify({'device_control_state': enabled})
    });
    if (enabled == false){
        document.getElementById('filt-set-type-'+curr_id).disabled = true;
        document.getElementById('filt-set-state-'+curr_id).disabled = true;
        document.getElementById('filt-set-count-'+curr_id).disabled = true;
        document.getElementById('volt-set-range-'+curr_id).disabled = true;
        document.getElementById('volt-set-level-'+curr_id).disabled = true;
        document.getElementById('vl_set-'+curr_id).disabled = true; 
        document.getElementById('curr-set-comp-'+curr_id).disabled = true; 
        document.getElementById('cc_set-'+curr_id).disabled = true;
        document.getElementById('fc_set-'+curr_id).disabled = true;     

    } else{
        document.getElementById('filt-set-type-'+curr_id).disabled = false;
        document.getElementById('filt-set-state-'+curr_id).disabled = false;
        document.getElementById('filt-set-count-'+curr_id).disabled = false;
        document.getElementById('volt-set-range-'+curr_id).disabled = false;
        document.getElementById('volt-set-level-'+curr_id).disabled = false;
        document.getElementById('vl_set-'+curr_id).disabled = false; 
        document.getElementById('curr-set-comp-'+curr_id).disabled = false; 
        document.getElementById('cc_set-'+curr_id).disabled = false;
        document.getElementById('fc_set-'+curr_id).disabled = false; 
    }
}

//updates the visual state of a k2410 enable/disable button
function set_K2410_button_state(){
    for (let x in K2410_devices) {
        var curr_id = K2410_devices[x];
        $.getJSON('/api/' + api_version + '/gpib/devices/' + curr_id + '/device_control_state', function(response){
            var enable_value = response.device_control_state;
            var enablecheck = document.getElementById("task-enable-"+curr_id);
            enablecheck.checked = enable_value;
        });
    }
}


//updates the values of elements in each k2510 interface
function update_k2510_elements(){
    for (let x in K2510_devices) {
        var curr_id = K2510_devices[x];
        var id_target = ("#id-" + curr_id + "");
        $(id_target).html(curr_id);
    }    
}

//Obtains the entered voltage level value, performs validation and sends it to the 
//adapter program if it meets the input criteria 
function set_voltage_level(id,curr_id){
    var v_input_box = (document.getElementById(id))
    var regexVolt = /^-?\d+(\.\d{1,3})?$/;

    if (regexVolt.test(v_input_box.value)){
        $.getJSON('/api/' + api_version + '/gpib/devices/' + curr_id + '/voltage', function(response) {

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

    var v_in = document.getElementById('volt-set-level-'+curr_id).value;
    var voltage = parseFloat(v_in);

    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + curr_id + '/voltage',
        contentType: "application/json",
        data: JSON.stringify({'voltage_set': voltage})  }); 
    });        
    } else {
        console.log("Failed test");
        v_input_box.value = "";
    }
}

//sets the voltage range from on a value selected from a dropdown 
function set_voltage_range(curr_id){
    var r_in = document.getElementById('volt-set-range-'+ curr_id).value;

    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + curr_id + '/voltage',
        contentType: "application/json",
        data: JSON.stringify({'voltage_range': r_in})
    });
}

//obtains the entered compliance current value, performs validation and sends it to the
//adapter program if it meets the input criteria
function set_current_comp(id,curr_id){
    var c_input_box = (document.getElementById(id))
    var regexCurr = /^\d+(\.\d{1,3})?$/;
    if (regexCurr.test(c_input_box.value)){
        if (c_input_box.value > 1000) c_input_box.value = 1000;
        var cc_in = document.getElementById('curr-set-comp-'+curr_id).value;
        var curr_comp = parseFloat(cc_in);
        $.ajax({
            type: "PUT",
            url: '/api/' + api_version + '/gpib/devices/' + curr_id + '/current',
            contentType: "application/json",
            data: JSON.stringify({'current_comp_set': curr_comp})
        });
    } else {
        c_input_box.value = "";
    }
}

//obtains the entered filter count value, performs validation and sends it to the
//adapter program if it meets the input criteria
function set_filter_count(id,curr_id){
    var f_input_box = (document.getElementById(id))
    var regexVolt = /^\d+$/;

    if (regexVolt.test(f_input_box.value)){
        $.getJSON('/api/' + api_version + '/gpib/devices/' + curr_id + '/filter', function(response) {
            var filt_curr_type = response.filter.filter_curr_type;
            if (filt_curr_type.includes("Moving")){
                if (f_input_box.value < 1){ f_input_box.value = 1;}
                if (f_input_box.value > 100){ f_input_box.value = 100;}
            }
            if (filt_curr_type.includes("Repeating")) {
                if (f_input_box.value < 1){ f_input_box.value = 1;}
                if (f_input_box.value > 10){ f_input_box.value = 10;}
            }      
            var fc_in = document.getElementById('filt-set-count-'+curr_id).value;
            var filt_count = parseInt(fc_in);

            $.ajax({
                type: "PUT",
                url: '/api/' + api_version + '/gpib/devices/' + curr_id + '/filter',
                contentType: "application/json",
                data: JSON.stringify({'filter_count': filt_count})
                })
    })
    } else {
        f_input_box.value = "";
    }
}

//obtains the most up to date value of the filter state in the parameter tree
function set_filter_state(curr_id){
    var fs_in = document.getElementById('filt-set-state-'+curr_id).value;

    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + curr_id + '/filter',
        contentType: "application/json",
        data: JSON.stringify({'filter_enable': fs_in}) 
    })
}

//obtains the most up to date value of the filter type in the paramter tree
function set_filter_type(curr_id){
    var ft_in = document.getElementById('filt-set-type-'+curr_id).value;
    if (ft_in === "REP"){
        var curr_count = document.getElementById('filt-curr-count-'+curr_id).innerHTML;
        if (curr_count > 10){
            var filt_count = 10;
            $.ajax({
                type: "PUT",
                url: '/api/' + api_version + '/gpib/devices/' + curr_id + '/filter',
                contentType: "application/json",
                data: JSON.stringify({'filter_count': filt_count})
                });
            };
        }
    
    $.ajax({
        type: "PUT",
        url: '/api/' + api_version + '/gpib/devices/' + curr_id + '/filter',
        contentType : "application/json", 
        data: JSON.stringify({'filter_type': ft_in})
    })
}

//obtains the current loaded api adapters
function update_api_adapters() {

    $.getJSON('/api/' + api_version + '/adapters/', function(response) {
        adapter_list = response.adapters.join(", ");
        $('#api-adapters').html(adapter_list);
    });
}