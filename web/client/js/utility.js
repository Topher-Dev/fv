function format_date(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function clear_url_params() {
    // Get the current URL without any parameters
    const url_without_params = window.location.protocol + "//" + window.location.host + window.location.pathname;

    // Use history.pushState to change the URL without reloading
    window.history.pushState({path: url_without_params}, '', url_without_params);
}


//------------------------------------------ PROTOTYPES ------------------------------------------

const swap_array_elements = function(arr, indexA, indexB) {
    const temp = arr[indexA];
    arr[indexA] = arr[indexB];
    arr[indexB] = temp;
};

Array.prototype.swap = function(indexA, indexB) {
    swap_array_elements(this, indexA, indexB);
};

Number.prototype.between = function(a, b) {
    const min = Math.min.apply(Math, [a, b])
    const max = Math.max.apply(Math, [a, b]);
    return this > min && this < max;
};

function is_object(o){
    return Object.prototype.toString.call(o) === '[object Object]';
}

//------------------------------------------ CHARTS ------------------------------------------
function create_chart(id, config){
    //Chart needs to be destroyed before canvas can be reused
    window[id].attached === true && window[id].destroy();   

    window[id] = new Chart(document.getElementById(id).getContext('2d'), config);

}

function config_chart(type, data, options){
    return {
        type: type,
        data: data,
        options: options
    }
}

//Provide a default empty template for create_chart if no data recieved
const empty_chart = {
    labels: [],
    datasets: [{
        data: []
    }]
}


//------------------------------------------ FORMS  ------------------------------------------

function show_errors(component, errors){
    
    errors.forEach( e => {
        const [ id, message ] = e.split("|");
        const li = document.createElement("li");
        const ul = component.elem.querySelector(`#${id} ~ .form-help-text`);

        li.appendChild(document.createTextNode("+ " + message));
        ul.appendChild(li);

        //How we display errors changes based on the amount displayed to user
        if (ul.querySelectorAll("li").length > 1 && ul.classList.contains("single")){
            ul.classList.replace("single", "multiple");
        }

        !ul.classList.contains("red") && ul.classList.add("red");
    })
}

function clear_errors(component){
    component.elem.querySelectorAll(".form-help-text").forEach( h =>
        h.innerHTML = ""   
    );
}

function fill_form(form, data){

    //if form is a string get element reference
    if (typeof form === "string"){
        form = Q(form);
    } else {
        form = form.elem;
    }

    //check if form is a form element
    if (form.tagName !== "FORM"){
        return log("Failed to load from: ", form);
    }

    Object.entries(data).forEach(([key, val]) => {
        //get reference to element with matching name attribute
        const destination_el = form.querySelector(`[name="${key}"]`);
        
        //check if elem exists
        if (destination_el){
            destination_el.value = val;
        } else {
            console.warn(`Failed to load form with Key:${key}, Val: ${val}`);
        }
    })
}

function clear_form(form) {
    // Get all form elements in the form
    const elements = form.elements;
  
    // Loop through each form element and clear its value
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const tagName = element.tagName.toLowerCase();
  
      if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
        element.value = '';
      }
    }
  }

function sync_form(formData, component){
     // Iterate over the form data
    for (var pair of formData.entries()) {

        var key = pair[0];
        var value = pair[1];

        const result = component.data.form.find( el => el.name === key)

        if (result) {
            result.value = value;
        }
    }

    component.render();

}
  
function get_key(event){
    const el = event.target;
    //get reference to closest data-key element
    return el.closest("[data-key]")?.dataset.key;
}

//------------------------------------------ Mobile  ------------------------------------------

function mobile_detect(){
    if ((/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) 
        || (window.matchMedia("only screen and (max-width: 760px)").matches) 
        || (navigator.userAgentData?.mobile === true)) 
    {
        //app.is_mobile = true;
        Q("body").classList.add("is-mobile");
    }
}

//------------------------------------------ Strings  ------------------------------------------
function is_string_json(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Add 'active' esque class to an element
 * @param {Element} el
 * @return {Boolean}
 */

 function activate(selector, class_name = "active"){
    const el = Q(selector);
    if ( el instanceof HTMLElement ){
        return el.classList.contains(class_name) 
            ? true 
            : el.classList.add(class_name) || el;
    } else return !!console.log("Non HTMLElement: ", el);
}

/**
 * Remove 'active' esque class from element
 * @param {Element} el 
 * @return {Boolean}
 */

function deactivate(selector, class_name = "active"){
    const el = Q(selector);
    if ( el instanceof HTMLElement ){
        return el.classList.contains(class_name) 
            ? !el.classList.remove(class_name) || el
            : true;
    } else return !!console.log("Non HTMLElement: ", el);
}

function Q(selector, is_select_all = false){
    return (is_select_all === false 
        ? document.querySelector(selector) 
        : document.querySelectorAll(selector)) || undefined;
}

function hide(selector){
    return !Q(selector)?.classList.add("hide") ? Q(selector) : undefined;
};

function show(selector){
    return !Q(selector)?.classList.remove("hide") ?  Q(selector) : undefined;
}

function lock(selector){
    const el = Q(selector);
    return !el?.classList.add("lock") ? el : undefined;
}

function unlock(selector){
    const el = Q(selector);
    return !el?.classList.remove("lock") ? el : undefined;
}

function truncate(text, length, minimum = 20) {
  return text.length - minimum > length
    ? html` <p>
                <span class="truncate-shown" >${text.substring(0, length)}</span>
                <span class="truncate-dots" >...</span>
                <button data-action="more" onclick="handle_truncate()" class="truncate-more">Show more</button>
                <span class="truncate-hidden hide">${text.substring(length)}</span>
                <button data-action="less" onclick="handle_truncate()" class="truncate-less hide">Show less</button>
            </p>`
    : text;
}

function handle_truncate({ target: btn }) {

    const { action } = btn.dataset;

    if ( action === "more"){
        hide(".truncate-dots");
        show(".truncate-hidden")
        show(".truncate-less");
    } else if ( action === "less"){
        show(".truncate-dots");
        hide(".truncate-hidden")
        show(".truncate-more");
    }

    btn.classList.add("hide");

}

var timers = (function() {
    let timers = []
    const getIndex = (array, attr, value) => {
        for (let i = 0; i < array.length; i += 1) {
            if (array[i][attr] === value) {
                return i
            }
        }
        return -1
    };
  
    const add = (callback, time) => {
        
        const id = setTimeout(() => {
            let index = getIndex(timers, 'id', id)
            timers.splice(index, 1)
            callback()
        }, time)

        timers.push({
            id: id,
            time: time,
            startTime: new Date(),
            debug: callback.toString()
        })

        return id;
    };
    
    // get time elapsed 
    const time = id => new Date() - timers[id].startTime;

    // get all active timers
    const all = () => timers
  
    // stop timer by timer id
    const stop = (id) => {
        if (!isNaN(id)) {
            let index = getIndex(timers, 'id', id)
            if (index !== -1) {
                clearTimeout(timers[index].id)
                timers.splice(index, 1)
            }
        }
    };
  
    // stop all timers
    const stopAll = () => {
      for (let i = 0; i < timers.length; i++) {
        clearTimeout(timers[i].id)
      }
      timers = []
    };
  
    return {
        time: time, //estimate
        add: add,
        all: all,
        stop: stop,
        stopAll: stopAll,
    };
})();


function observeElementRemoval(elementId, callback) {
    // Select the node that will be observed for changes
    const targetNode = document.documentElement;
  
    // Options for the observer (which mutations to observe)
    const config = { childList: true, subtree: true };
  
    // Callback function to execute when mutations are observed
    const observerCallback = function(mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          for (const removedNode of mutation.removedNodes) {
            if (removedNode.id === elementId) {
              // Element with specified ID has been removed
              observer.disconnect(); // Stop observing
              callback(); // Execute callback function
              return;
            }
          }
        }
      }
    };
  
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(observerCallback);
  
    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
  }

  function modal_transition(instance){
    const modal_containor = Q("#modal-containor")

    const currentWidth = modal_containor.offsetWidth;
    const currentHeight = modal_containor.offsetHeight;

    // Change the content inside the container
    const content =Q("#modal-content");
    modal_containor.style.overflow = "hidden";
    content.style.opacity = "0";
    content.clientWidth;
    content.style.transition =".25s opacity ease-in";

    instance.render();
  
    modal_containor.classList.add('expand');

    // Get the new dimensions after content change
    const newWidth = modal_containor.offsetWidth;
    const newHeight = modal_containor.offsetHeight;
    
    modal_containor.classList.remove('expand');
    // Animate the transition by adding a temporary class
    
    //console.log(currentWidth, currentHeight)
    //console.log(newWidth, newHeight)
  
    // Wait for the next frame to apply the new dimensions
    requestAnimationFrame(function() {
      modal_containor.style.width = currentWidth + 'px';
      modal_containor.style.height = currentHeight + 'px';
      
  
      // Wait for the next frame to trigger the transition
      requestAnimationFrame(function() {
        modal_containor.style.width = newWidth + 'px';
        modal_containor.style.height = (newHeight + 30) + 'px';
  
        setTimeout(() => {
            content.style.opacity = "1";
            content.clientWidth;
            setTimeout(() => {
                Q("#modal-content").style.transition ="none";
                modal_containor.style.overflow = "auto";
            }, 100);
        }, 100);
        
      });
    })
}

async function fetch_selling_days(){

    const today = new Date();

    const month = today.getMonth() + 1; // returns an integer value representing the month, starting from 0 for January
    const year = today.getFullYear();

    let branch_id = 0;

    if (app.data.user?.branches?.list){
        branch_id = app.data.user.branches.list[0].id
    }

    const params = {
        year,
        month,
        branch_id: Q("#branch-select")?.value || branch_id
    }

    const response = await arc.get("selling_days", "select_by_month", params);

    if (response.status ===0){
        app.data.selling_days = response.data;
        return true;
    }

    return false;

}

function put_selling_days(){

    const today = new Date();

    const month = today.getMonth() + 1; // returns an integer value representing the month, starting from 0 for January
    const year = today.getFullYear();

    const selling_days_data = app.data?.selling_days

    if (!selling_days_data) return false;
 
    //get todays date and find the selling day that matches and the number that date is in the array
    let current_selling_day = "N/A"

    const today_date = `${year}-${month < 10 ? '0' : ''}${month}-${today.getDate() < 10 ? '0' : ''}${today.getDate()}`;

    const selling_days = selling_days_data.filter(selling_day => {
        //filter so we only have selling days with .is_selling_day = true
        if (selling_day.is_selling_day === true) return selling_day;
    })

    //sort the selling
    selling_days.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((selling_day, i) =>{

        if (today_date === selling_day.date){
            current_selling_day = i + 1;
        }
    });

    const total_selling_days = selling_days.length;

    return `${current_selling_day} of ${total_selling_days}`;


}

function exports(){
// 1) Get the active
	const exports = app.view.active?.exports;
	
	if (!exports){
		show_message(`No export options for module: ${app.view.active.name}`);
		return;
	}

	app.modal.open("Export Options", modal_exports, { exports });
}

function get_remaining_time(work_remaining, work_remaining_days, is_complete, is_overdue=false){

    let text, css_class;
    if (is_complete) return ["&#10003;", "complete", 0];
    if (is_overdue) {
        text = "Overdue";
        css_class = "danger";
        return [text, css_class];
    }

    const [days, hours, minutes] = work_remaining;

    // if remaining time is over 24 hours, return days in format "x day(s)"
    if (minutes > 1440){
        text = `${work_remaining_days} day`;
        css_class = "good";
        //pluralize if more than 1 day
        if (work_remaining_days >= 2) text += "s";

        return [text, css_class];
    }

    //if remaining time is under 24 hours, return hours in format "x hour(s)"
    if (minutes > 60){
        text = ` ${Math.floor(hours)} hour`;

        //if remaining time is under 4 hours, return warning
        css_class = hours > 4 ? "good" : "warning";

        //pluralize if more than 1 hour
        if (hours >= 2) text += "s";

        return [text, css_class];
    }

    //if remaining time is under 1 hour, return minutes in format "x minute(s)"
    if (minutes > 0){
        text = ` ${Math.floor(minutes)} minute`;
        css_class = "warning";
        //pluralize if more than 1 minute
        if (minutes >= 2) text += "s";

        return [text, css_class];
    }

    //if remaining time is negative, return "overdue"
    if (minutes == 0) {
        text = "";
        css_class = "not-set";
        return [text, css_class];
    }

}

//eg 35716000 to 9:55:16
function format_remaining_time(milliseconds){

    const days = milliseconds / 86_400_000;
    const hours = milliseconds/ 3_600_000;
    const minutes = milliseconds / 60_000;

    return [days, hours, minutes];

}

function get_days_left(target_datetime){

    const now = new Date().getTime();
    const target = new Date(target_datetime).getTime();
    const time_until_target_date = target - now;

    //if diff is negative, return 0
    if (time_until_target_date < 0) return 0;

    let days_until_target_date = Math.ceil(time_until_target_date / 86400000);

    //get the time until tomorrow
    const tomorrow = new Date(now + 86400000).setHours(0, 0, 0, 0);
    const time_until_tomorrow = tomorrow - now;

    //if time until tomorrow is less than time until target date, add 1 to days until target date
    if (time_until_tomorrow < time_until_target_date) {
        days_until_target_date += 1;
    }

    return days_until_target_date;

}
/*  
    get the number of days between now and the target date and loop through them.
    1)handle the first day
        check if 
    2)handle the last day
    3)handle any day that is not the first or last day

*/ 
function calculate_remaining_time(target_datetime_str, department_ids, selling_days) {

    if (!target_datetime_str){
	    return { total_remaining_raw: 0, work_remaining_raw: 0, work_remaining_days: 0 };
    }

    const target_datetime = new Date(target_datetime_str);
    const now = new Date()
    const target = new Date(target_datetime)
    let time_remaining = target - now;

    const time_remaining_by_day = []

    let days_remaining = get_days_left(target_datetime);
    ////console.log("Days remaining: " + days_remaining)
    for (let i = 0; i < days_remaining; i++){
        ////console.log(i);
        let time_earliest_open = Infinity;
        let time_latest_open = -Infinity;

        //figure out what day of the week it is
        const i_date = new Date((now.getTime() + (i * 86400000)));
        //get i_date in string yyyy-mm--dd format
        const i_year = i_date.getFullYear();
        const i_month = String(i_date.getMonth() + 1).padStart(2, '0');
        const i_day = String(i_date.getDate()).padStart(2, '0');

        const i_date_format = `${i_year}-${i_month}-${i_day}`;
        
        if (!((i_date_format in selling_days) && selling_days[i_date_format] === true)){
            time_remaining_by_day.push(0);
            continue
        }

        const day = i_date.toLocaleString('en-US', { weekday: 'long' }).toLocaleLowerCase();

        for (const department_id of department_ids) {

            const department = app.data.departments[Number(Q("#branch-select").value)][department_id];
            const hours_of_operation = department.hours_of_operation[day];
	
            const [start_hour, end_hour] = hours_of_operation.split(' - ');
	    ////console.log(department, hours_of_operation, start_hour, end_hour);

	    if (hours_of_operation === "closed"){
		continue;
	    }

            const [start_hour_value, start_minute_value] = start_hour.split('h');
            const [end_hour_value, end_minute_value] = end_hour.split('h');
    
            const start_time = start_hour_value * 3600000 + start_minute_value * 60000;
            const end_time = end_hour_value * 3600000 + end_minute_value * 60000;

            if (start_time <= time_earliest_open) {
                time_earliest_open = start_time; // Update the earliest start time
            }
            
            ////console.log(end_time > time_latest_open)
            if (end_time >= time_latest_open) {
                time_latest_open = end_time; // Update the latest stop time
            }
        }

        ////console.log("Hours of operation: " + i_date_format + ": " + time_earliest_open/ ( 3600 * 1000) + " to " + time_latest_open/ ( 3600 * 1000))
        //check if the target date is within the hours of operation
        
        if (target > (i_date.setHours(0, 0, 0, 0) + time_latest_open)) {

            //this means the target date is after the hours of operation for this day, we can assume the full day is available unless its the last day
            if (i === 0) {
                //get now until the end of the work day, if its negative, set to 0
                let time_remaining_today = (i_date.setHours(0, 0, 0, 0) + time_latest_open) - now;
                if (time_remaining_today < 0) time_remaining_today = 0;

                time_remaining_by_day.push(time_remaining_today);
                continue;
            }

            //check if we

            time_remaining_by_day.push(time_latest_open - time_earliest_open);

            continue;
        }

        //we need to check if the target date is before the hours of operation for this day, if so we can assign 0
        if (target < (i_date.setHours(0, 0, 0, 0) + time_earliest_open)) {
            time_remaining_by_day.push(0);
            continue;
        }

        //check if its between the hours of operation
        if (target > (i_date.setHours(0, 0, 0, 0) + time_earliest_open) && target < (i_date.setHours(0, 0, 0, 0) + time_latest_open)) {
            
            if (target < now){
                time_remaining_by_day.push(0);
                continue;
	        }

	    if (now < (i_date.setHours(0, 0, 0, 0) + time_earliest_open)){
		    time_remaining_by_day.push(Math.abs(target - (i_date.setHours(0, 0, 0, 0) + time_earliest_open)));
		    continue;
	    }

	    if (now > (i_date.setHours(0, 0, 0, 0) + time_latest_open)){
            time_remaining_by_day.push(0);
            continue;

	    }

            time_remaining_by_day.push(target - now);
            // //console.log("Target is between hours of operation")
            continue;
        }

        //console.log();
        time_remaining_by_day.push(target - (i_date.setHours(0, 0, 0, 0) + time_earliest_open));
  
    }

    //subtract the hours of operation window from the target date
    const work_time_remaining = time_remaining_by_day.reduce((acc, val) => acc + val, 0);
    const work_remaining_days = time_remaining_by_day.filter(item => item > 0).length;

    return { total_remaining_raw: time_remaining, work_remaining_raw: work_time_remaining, work_remaining_days };
}


function update_ui_alerts_count(count){

    const el = Q("#alert-notification-count");

    if (!el) {
        document.title = "Salesprep";
        return;
    };

    if (!count){
        document.title = "Salesprep";
        el.innerHTML = 0;
        el.classList.add("hide");
        return;
    }

    //ensure the text is plural if more than 1 alert
    let text = count === 1 ? "Alert" : "Alerts";

    document.title = `Salesprep [ ${count} ${text} ]`;
    el.innerHTML = count;
    el.classList.remove("hide")
    
}

// Usage example:
// const some_date = new Date("2023-08-21 15:31:35");
// //console.log(time_elapsed_since(some_date));
//rounds all
function time_elapsed_since(psql_datetime) {
    const timestamp = Date.parse(psql_datetime);
    if (isNaN(timestamp)) {
      return 'Invalid timestamp';
    }
  
    const now = new Date().getTime();
    let seconds_past = Math.floor((now - timestamp) / 1000);

    // Ensure seconds_past is at least 1
    seconds_past = Math.max(seconds_past, 1);
  
    if (seconds_past < 60) {
      return seconds_past === 1 ? '1 second ago' : seconds_past + ' seconds ago';
    }
  
    if (seconds_past < 3600) {
      const minutes = Math.floor(seconds_past / 60);
      return minutes === 1 ? '1 min ago' : minutes + ' min ago';
    }
  
    if (seconds_past < 86400) {
      const hours = Math.floor(seconds_past / 3600);
      return hours === 1 ? '1 hour ago' : hours + ' hours ago';
    }
  
    if (seconds_past < 2592000) {
      const days = Math.floor(seconds_past / 86400);
      return days === 1 ? '1 day ago' : days + ' days ago';
    }
  
    const months = Math.floor(seconds_past / 2592000);
    return months === 1 ? '1 month ago' : months + ' months ago';
}

//convert inches to feet and inches
function inches_to_feet(inches){
    const feet = Math.floor(inches / 12);
    const remaining_inches = inches % 12;

    return `${feet}'${remaining_inches}"`;
}

function format_date(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function format_time(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
