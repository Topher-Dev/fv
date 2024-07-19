/**
 * A simple template engine for creating / escaping - prepends all of our template literals eg. html`<h1>${h1}</h1>`.
 * Synergizes with vscode extention "lit-html" Syntax highlighting and IntelliSense for html inside template strings
 * @param  {Array} literals the strings that surround the substitutions eg. ["\n   <h1>","\n   <h2>"]
 * @param  {Array} substitutions the interperolated values eg ["h1"]
 */

function html(literals, ...substitutions) {
    return literals.raw.reduce((accumulation, literal, i) => {

        let subst = substitutions[i-1];
        if (Array.isArray(subst)) {
            subst = subst.join('');
        }

        if (accumulation.endsWith('$')) {
            subst = html_escape(subst);
            accumulation = accumulation.slice(0, -1);
        }
        
        return (accumulation + subst + literal).replace(/\s*\n\s*/g, ' ');
    });
}

function html_escape(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/>/g, '&gt;')
              .replace(/</g, '&lt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/`/g, '&#96;');
}


// Global variables
const messageQueue = [];
let isMessageDisplayed = false;

function show_message(message) {
  // Add the message to the queue
  messageQueue.push(message);

  // If a message is already being displayed, return
  if (isMessageDisplayed) {
    return;
  }

  // Display the next message in the queue
  displayNextMessage();
}

function displayNextMessage() {

  if (messageQueue.length === 0) {
    return;
  }

  // Set the flag to indicate that a message is being displayed
  isMessageDisplayed = true;

  const sm = Q("#show-message");
  const message = messageQueue.shift();

  sm.innerText = message;
  sm.classList.add("active");
  sm.clientWidth; //force layout to ensure CSS transition starts.
  sm.classList.add("transition");

  // Calculate the display duration dynamically based on message length and reading speed
  const displayDuration = Math.max(4000, message.length * 70);

  setTimeout(() => {
    sm.classList.remove("transition");
    setTimeout(() => {
      sm.innerText = "";
      sm.classList.remove("active");
      isMessageDisplayed = false;

      // Display the next message in the queue
      displayNextMessage();
    }, 1000);
  }, displayDuration);
}


function get_input_validation(key){

    const input_validations = {
        validate_email: async function(e){
            
            const input = e.target;
            const value = input.value;

            if (value === "") {
                input.focus();
                return;
            }

            const response= await arc.get(AUTH, "email_check", { email: value });

            const input_group = input.closest(".input-std-group");
            const svg = input_group.querySelector("svg");
            const circle_loader = input_group.querySelector("div.circle-loader");
            const hint = input_group.querySelector("p.input-std-hint");

            if (response.status ===0){
                input.classList.remove("failure");
                input.classList.add("success");
                circle_loader.classList.remove("hide");
                svg.classList.add("hide");
                hint.classList.add("hide");
                Q("#person_password").focus();
                //store the email in local storage 
                localStorage.setItem("email", value);
            } else {
                input.classList.remove("success");
                input.classList.add("failure");
                circle_loader.classList.add("hide");
                svg.classList.remove("hide");
                hint.innerText = "Email not found!";
                hint.classList.remove("hide");
                //remove the email from local storage
                localStorage.removeItem("email");
            }

        }
    }

    //check if the key is a validation
    if (input_validations[key]) {
        return input_validations[key];
    } else {
        console.warn(`Validation ${key} not found`);
        return false;
    }
}

function get_icon({ type, css_class, name }){
    switch (type) {
        case "svg":
            return get_svg(name, `class="${css_class}"`)
        default:
            return "";
    }
}

/*
A function that builds a form field based on a template
@param {string} template - The template to use
@param {object} build_package - The data to build the field with
*/
function field_builder(build_package){

    /* eg
        [{
            template: "input-std",
            label: "company",
            name: "company",
            id: 1,
            value: "sales prep",
            class_list: "d--f fd--c",
            element: {},
            validation: {},
            label: {},
            icon: {}
        }]
     */
    const { template, label, element, validation, name, id, value, class_list, icon } = build_package;

    //Compile the attributes into an array which will be joined & interporlated into the html

    const label_attributes = Object
        .entries(label?.attributes?.keyval || {})
        .map(([k,v]) => `${k}="${v}" ` || [])
        .concat(Object.entries(label?.attributes?.data || {})
            .map(([k,v]) => `data-${k}="${v}" `) || [])
            .concat(label?.attributes?.single?.join(" ") || []);

    const element_attributes = Object.entries(element?.attributes?.keyval || {})
        .map(([k,v]) => `${k}="${v}"`)
        .concat(Object.entries(element?.attributes?.data || {})
        .map(([k,v]) => `data-${k}="${v}" `))
        .concat(Object.entries(validation || {})
        .map(([k,v]) => `${k}="${v}" `))
        .concat(element?.attributes?.single?.join(" ") || [])

    switch (template) {
        case "input-std":
            return html`
                <div class="input-std-group ${class_list || ''} ${icon ? 'ps--r' : ''}">
                    <p class="truncate input-std-hint hint-${name} hide"></p>
                    <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                    <input
                        ${value ? `value="${value}"` : ""}
                        class="input-std-input" 
                        name="${name}" 
                        id="${id}"
                        ${element_attributes}
                    >
                    ${icon ? get_icon(icon) : ""}
                </div>`;
        case "input-datetime":
            return html`
                <div class="input-std-group ${class_list || ''} ${icon ? 'ps--r' : ''}">
                    <p class="truncate input-std-hint hint-${name} hide"></p>
                    <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                    <input
                        ${value ? `value="${value}"` : ""}
                        class="input-std-input" 
                        name="${name}" 
                        id="${id}" 
                        type="datetime-local"
                        ${element_attributes}
                    >
                    ${icon ? get_icon(icon) : ""}
                </div>`;
        case "input-boolean":
            return html`
                <div class="input-std-group ${class_list || ''} ${icon ? 'ps--r' : ''}">
                    <p class="truncate input-std-hint hint-${name} hide"></p>
                    <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                    <div class="toggle-wrapper">
                        <input
                            ${value ? 'checked' : ''}
                            ${element?.attributes?.disabled ? 'disabled' : ''}
                            class="toggle in-stock"
                            name="${name}"
                            id="${id}"
                            type="checkbox"
                            ${element_attributes}
                        >
                        <label for="${id}" class="toggle--label"></label>
                        <div class="foux-toggle"></div>
                    </div>
                </div>`;
        case "input-adv":
                return html`
                    <div class="input-std-group ${class_list || ''} ${icon ? 'ps--r' : ''}">
                        <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                        <p class="input-std-hint hide"></p>
                        <input
                            ${value ? `value="${value}"` : ""}
                            class="input-std-input" 
                            name="${name}" 
                            id="${id}" 
                            ${element_attributes}
                        >
                        ${icon ? get_icon(icon) : ""}
                        <div style="border:none !important" class="ps--a hide circle-loader load-complete" onclick="uncomplete_item()">
                            <div class="checkmark draw" style="display:block;"></div>
                        </div>
                    </div>`;
        case "input-hidden":

            return html`
                <input
                    ${value ? `value=${value}` : ""}
                    type="hidden" 
                    name="${name}" 
                    id="${id}" 
                    ${element_attributes}
                >`;
        case "input-textarea":
            break;
        case "input-hour-range":
            return html`
                <div class="input-hour-range ${class_list || ''}">
                    <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                    <input
                        ${value ? `value="${value}"` : ""}
                        class="input-std-input" 
                        name="${name}" 
                        id="${id}" 
                        ${element_attributes}
                    >
                </div>`;
        case "select-std":
            return html`
                <div class="select-std-group ${class_list || ''}">
                    <label id="${id}" for="${name}" class="select-std-label" ${label_attributes}>${label.text}</label>
                    <select ${element_attributes} name="${name}">${element.options.map( o => html`
                        <option ${o?.value == value ? "selected" : ""} value="${o.value}">${o.text}</option>`)}
                    </select>
                </div>`;
        case "select-multi":           
            return html`
                <div class="select-multi-group ${class_list || ''}">
                    <label id="${id}" for="${name}" class="select-multi-label" ${label_attributes}>${label.text}</label>
                    <select ${element_attributes} name="${name}" multiple>${element.options.map( o => { 
                        //console.log(name, "FYANK")
                        return html`
                        <option 
                            ${o?.value === "sms" ? "disabled" : ""}
                            ${o?.value ==="email" ? "selected" : ""}
                            ${o?.value == value ? "selected" : ""} 
                            value="${o.value}">${o.text}
                        </option>`})}
                    </select>
                </div>`;
        case "select-manage":
            return html`
            <div class="select-manage-group">
                <label id="${id}" for="${name}" class="select-manage-label hide" ${label_attributes}>${label?.text}</label>
                <div class="select-manage" ${class_list} data-mode="create">
                    <div class="selected-option-containor">
                        <input ${value ? html`value="$${value}"` : `value=""`} ${element_attributes} onfocus="open_select()" class="selected-option"  autocomplete="off" placeholder="add item..." />
                        <button onclick="switch_mode()" class="select-manage-edit-toggle">${get_svg('edit', 'class="svg-edit"')}</button>
                    </div>
                    <div class="select-options-containor">
                        <div class="select-options-add">
                            <input class="select-options-add-input" autocomplete="off" placeholder="add template item..." />
                            <button onclick="add_option()">${get_svg('check', 'class="svg-select"')}</button>
                        </div>
                        <ul role="list" class="select-options">${element.options.length > 0 ? element.options.map( o => {return html`
                            <li onclick="select_option()" data-type="${o.type}" data-id="${o.id}" data-value="$${o.description}" class="d--f jc--sb ai--c">
                                <span class="template-item truncate">$${o.description}</span>
                                ${get_svg('plus', 'class="svg-plus-2"')}
                            </li>`;}) : html`<li class="ta--c">No entries</li>`   }
                        </ul>
                    </div>
                </div>
            </div>`;
        case "select-multi-search":
            
            //parse the value
            const selected = JSON.parse(value) || {};
            //value format eg.{"people":[],"department":["2|sales","7|detail","5|parts"],"branch":["1|Fall River"],"company":["1|sales prep"]}
            const chips =  Object.entries(selected).reduce((accumulation, entity, i) =>{
                //add type,id,name to the chip
                const [key, val] = entity;

                //if there are no values, return an empty array
                if (val.length === 0) {
                    return accumulation;
                }

                //if there are values, add them to the array
                const values = val.map( v => {
                    const [id, name] = v.split("|");
                    return { id, name, type: key };
                });

                return accumulation.concat(values);
            } , []);

            const none_selected = chips.length === 0;
            
            if (!element?.options){
                element.options = [];
            }

            //Remove from the element.options any of the selected options
            const options = element.options.filter( o => {
                //console.log(element.options, chips, o)
                const selected = chips.find( c => Number(c.id) === Number(o.id) && c.type === o.type);
                //console.log(selected);
                return !selected;
            });

            return html`
                <div class="select-multi-search" style="width:fit-content">
                    <label for="${name}">${label.text}</label>
                    <input 
                        type="hidden" 
                        id="${name}" 
                        name="${name}" 
                        value='${value}'
                        ${element_attributes}
                    >
                    <div class="d--f g--400  multiselect-search">
                        <div class="multiselect-search-containor">
                            <input 
                                id="${id}"
                                placeholder="Search people, department, branch..." 
                                class="multiselect-search-input w--full"
                                ${element_attributes}
                                onkeyup="handle_search_input()"
                            >
                            <ul role="list" class="results">${options.map( r => html`
                                <li 
                                    data-id="${r.id}"
                                    data-type="${r.type}"
                                    data-name="${r.name}"
                                    class="d--f jc--sb ai--c"
                                    onclick="add_selection()"
                                >
                                    <div style="min-width: 28rem">
                                        <p class="d--f g--200 ai--c">
                                            ${get_svg(`${r.type}_chip`, 'class="svg-list"')}
                                            <span class="tt--c text-light">${r.name}</span>
                                        </p>
                                    </div>
                                    ${get_svg('plus', 'class="svg-plus-2"')}
                                </li>`)}
                            </ul>
                        </div>
                        <fieldset class="multiselect-search-selections">
                            <legend>Selected</legend>
                                <div class="multiselect-selected-containor ${!none_selected ? '' : 'ai--c d--f fd--c jc--c h--full pb--400 text-light'}">${!none_selected ? chips.map( s => html`
                                    <button 
                                        class="chip ${s.type}"
                                        data-id="${s.id}"
                                        data-type="${s.type}"
                                        data-name="${s.name}"
                                        ${element_attributes}
                                        onclick="remove_selection()">
                                        <p>${s.name}</p>${get_svg(`${s.type}_chip`, 'class="svg-chip"')}
                                    </button>`) : html`<p class="ta--c">No selections</p>`}
                                </div>
                        </fieldset>
                    </div>
                </div>`;
        default:
            break;
    }
}

function json_deep_parse(obj){
    if (typeof obj === "string") {
        try {
            return JSON.parse(obj);
        } catch (error) {
            return obj;
        }
    } else if (typeof obj === "object") {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key] = json_deep_parse(obj[key]);
            }
        }
        return obj;
    } else {
        return obj;
    }
}

function relations_package(relations_raw, relations_options){
    return Object.entries(relations_options).map(([key, val]) => {

        const relation_data = relations_raw[key];

        //print an error if the relation is not found
        if (!relation_data) {
            console.error(`Relation ${key} not found in relations object`, relations_raw);
            return;
        }
        //console.log(key, relation_data)
        return {
            key,
            header: val.header,
            module: val.module,
            count: relation_data.count,
            svg: val.svg,
            list: relation_data.list,
            controller: relation_data?.controller || val?.controller
        }
    });
}

function relation_builder(relation_data){

    const { header, count, key } = relation_data;

    return html`
        <section class="mb--300 relation" data-key="${key}">
            <h3 class="mb--200">${header} (${count})</h3>
            ${relation_module(relation_data, header, count)}
        </section>`;
}

function relation_module(data, header, count){

    const { module, list, svg, key } = data;

    const chip_class = relation_to_view[key].split("_")[0];
    switch (module) {
        case "one_to_many":
            return count > 0 
                ? html`
                    <ul role="list" class="d--f fw--w g--100 relation-list">${list.map( item => html`
                        <li class="relation-list-item">
                            <button 
                                class="relation-list-item-button-otm tt--c d--f ai--c g--200 chip ${chip_class}" 
                                data-id="${item.id}"
                                data-view=${relation_to_view[key]}
                                onclick="navigate_one()"
                            >
                                <span class="relation-list-item-name">${item.name}</span>
                                ${get_svg(svg, 'class="relation-list-item-svg"')}
                            </button>
                        </li>`)}
                    </ul>` 
                : html`                
                    <div class="d--f ai--c g--400">
                        <p class="tt--c">No ${header} found</p>
                    </div>`;
        case "many_to_many":
            return count > 0 
                ? html`
                    <div class="d--f ai--c g--400">
                        <button class="button-std" onclick="manage_relations()">Manage All</button>
                        <ul role="list" class="d--f fw--w g--100 relation-list">${list.map( item => html`
                            <li class="relation-list-item">
                                <button
                                    class="relation-list-item-button-mtm tt--c d--f ai--c g--200 chip ${chip_class}"
                                    data-view=${relation_to_view[key]}
                                    data-id="${item.id}"
                                    onclick="navigate_one()"
                                >
                                    <span class="relation-list-item-name">${item.name}</span>
                                    ${get_svg(svg, 'class="relation-list-item-svg"')}
                                </button>
                            </li>`)}
                        </ul>
                    </div>`
                : html`
                    <div class="d--f ai--c g--400">
                        <button class="button-std" onclick="manage_relations()">Manage All</button>
                        <p class="tt--c">No ${header} found</p>
                    </div>`;
        default:
            return html`<p>Relation module not found</p>`;
    }
}

//This will allow us to navigate to the correct view when a relation is clicked
const relation_to_view = {
    "companies": "company_manage",
    "branches": "branch_manage",
    "departments": "department_manage",
    "persons": "person_manage",
    "roles": "role_manage"
}

function get_svg(name, attributes = 'class="svg-std"'){

    switch (name) {
        case "alert-fill":
            return html`
            <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-bell-fill" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
            </svg>`;
        case "search":
            return html`
                <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>`;
        case "cancel":
            return html`
                <svg viewBox="0 0 13 12.911">
                    <path d="M4,11H7.8V5H4Zm0,7H7.8V12H4Zm4.557,0h3.8V12h-3.8Zm4.557,0h3.8V12h-3.8ZM8.557,11h3.8V5h-3.8Zm4.557-6v6h3.8V5Z" transform="translate(-5 16.911) rotate(-90)" fill="#8f959a"/>
                </svg>`;
        case "activity":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2Z"/>
                </svg>`;
        case "arrow-left":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>`;
        case "arrow-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                </svg>`;
        case "arrow-right-square":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
                </svg>`;
        case "caret-right":
            return html`
            <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16">
            <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
          </svg>`;
        case "caret-down-fill":
            return html`
                <svg ${attributes} fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16">
                    <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                </svg>`;
        case "chevron-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>`;
        case "user":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>`;
        case "lock":
            return html`
                <svg ${attributes} fill="currentColor" class="bi bi-lock-fill" viewBox="0 0 16 16">
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2"/>
                </svg>
            `;
        case "locked":
            return html`
                <svg ${attributes} fill="#000000" viewBox="-6.98 0 54.281 54.281">
                    <path id="padlock_locked" data-name="padlock locked" d="M316.862,161.6H281.35l-2.861,0a.98.98,0,0,0-.973.972v29.716a.975.975,0,0,0,.971.969h38.376a.977.977,0,0,0,.973-.971V162.565A.978.978,0,0,0,316.862,161.6Zm-14.145,23.28.317,1.173H292.315l.32-1.173,1.741-6.438a5.395,5.395,0,1,1,6.6,0Zm-16.907-30.9a11.865,11.865,0,1,1,23.73,0v5.29H312.6V153.68a14.729,14.729,0,0,0-14.714-14.71h-.43a14.731,14.731,0,0,0-14.714,14.71v5.589h3.064Z" transform="translate(-277.516 -138.97)"/>
                </svg>`;
        case "unlocked":
            return html`
                <svg ${attributes} fill="#000000" viewBox="-6.98 0 54.281 54.281">
                    <path id="padlock_locked" data-name="padlock locked" d="M316.862,161.6H281.35l-2.861,0a.98.98,0,0,0-.973.972v29.716a.975.975,0,0,0,.971.969h38.376a.977.977,0,0,0,.973-.971V162.565A.978.978,0,0,0,316.862,161.6Zm-14.145,23.28.317,1.173H292.315l.32-1.173,1.741-6.438a5.395,5.395,0,1,1,6.6,0Zm-16.907-30.9a11.865,11.865,0,1,1,23.73,0v5.29H312.6V153.68a14.729,14.729,0,0,0-14.714-14.71h-.43a14.731,14.731,0,0,0-14.714,14.71v5.589h3.064Z" transform="translate(-277.516 -138.97)"/>
                </svg>`;
        case "email":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                </svg>`;
        case "user-fill":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                </svg>`;
        case "loading-a":
            return html`       
                <svg version="1.1" id="L7" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                    viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
                    <path fill="#fff" d="M31.6,3.5C5.9,13.6-6.6,42.7,3.5,68.4c10.1,25.7,39.2,38.3,64.9,28.1l-3.1-7.9c-21.3,8.4-45.4-2-53.8-23.3
                    c-8.4-21.3,2-45.4,23.3-53.8L31.6,3.5z">
                        <animateTransform 
                            attributeName="transform" 
                            attributeType="XML" 
                            type="rotate"
                            dur="2s" 
                            from="0 50 50"
                            to="360 50 50" 
                            repeatCount="indefinite" />
                    </path>
                    <path fill="#fff" d="M42.3,39.6c5.7-4.3,13.9-3.1,18.1,2.7c4.3,5.7,3.1,13.9-2.7,18.1l4.1,5.5c8.8-6.5,10.6-19,4.1-27.7
                    c-6.5-8.8-19-10.6-27.7-4.1L42.3,39.6z">
                        <animateTransform 
                            attributeName="transform" 
                            attributeType="XML" 
                            type="rotate"
                            dur="1s" 
                            from="0 50 50"
                            to="-360 50 50" 
                            repeatCount="indefinite" />
                    </path>
                    <path fill="#fff" d="M82,35.7C74.1,18,53.4,10.1,35.7,18S10.1,46.6,18,64.3l7.6-3.4c-6-13.5,0-29.3,13.5-35.3s29.3,0,35.3,13.5
                    L82,35.7z">
                        <animateTransform 
                            attributeName="transform" 
                            attributeType="XML" 
                            type="rotate"
                            dur="2s" 
                            from="0 50 50"
                            to="360 50 50" 
                            repeatCount="indefinite" />
                    </path>
                </svg>`;
        case "organization_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-buildings" viewBox="0 0 16 16">
                    <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022ZM6 8.694 1 10.36V15h5V8.694ZM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5V15Z"/>
                    <path d="M2 11h1v1H2v-1Zm2 0h1v1H4v-1Zm-2 2h1v1H2v-1Zm2 0h1v1H4v-1Zm4-4h1v1H8V9Zm2 0h1v1h-1V9Zm-2 2h1v1H8v-1Zm2 0h1v1h-1v-1Zm2-2h1v1h-1V9Zm0 2h1v1h-1v-1ZM8 7h1v1H8V7Zm2 0h1v1h-1V7Zm2 0h1v1h-1V7ZM8 5h1v1H8V5Zm2 0h1v1h-1V5Zm2 0h1v1h-1V5Zm0-2h1v1h-1V3Z"/>
                </svg>`;
        case "company_chip":
        case "company_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-building" viewBox="0 0 16 16">
                    <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1ZM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Z"/>
                    <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1Zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1Z"/>
                </svg>`;
        case "branch_chip":
        case "branch_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-diagram-3" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1zM0 11.5A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm4.5.5A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm4.5.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/>
                </svg>`;
        case "nav-ufc-fight":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
                </svg>`;
        case "department_chip":
        case "department_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-people" viewBox="0 0 16 16">
                    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                </svg>`;
        case "role_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-person-vcard" viewBox="0 0 16 16">
                    <path d="M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm4-2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5ZM9 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4A.5.5 0 0 1 9 8Zm1 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z"/>
                    <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2ZM1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8.96c.026-.163.04-.33.04-.5C9 10.567 7.21 9 5 9c-2.086 0-3.8 1.398-3.984 3.181A1.006 1.006 0 0 1 1 12V4Z"/>
                </svg>`;
        case "nav-ufc-event":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-list-stars" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5"/>
                    <path d="M2.242 2.194a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.256-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194z"/>
                </svg>`;
        case "nav-ufc-fighter":
        case "person_chip":
        case "person_list":
            return html`
                <svg ${attributes}  fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>`;
        case "person_fill":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                </svg>`;
        case "person_add":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-person-add" viewBox="0 0 16 16">
                    <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0Zm-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                    <path d="M8.256 14a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256Z"/>
                </svg>`;
        case "person_circle":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                </svg>`;
        case "serti":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-cloud-arrow-up" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z"/>
                    <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z"/>
                </svg>`;
        case "selling_days":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-calendar-check" viewBox="0 0 16 16">
                    <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                </svg>`;
        case "prepsheet_list":
        case "prepsheet":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-file-earmark-spreadsheet" viewBox="0 0 16 16">
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V9H3V2a1 1 0 0 1 1-1h5.5v2zM3 12v-2h2v2H3zm0 1h2v2H4a1 1 0 0 1-1-1v-1zm3 2v-2h3v2H6zm4 0v-2h3v1a1 1 0 0 1-1 1h-2zm3-3h-3v-2h3v2zm-7 0v-2h3v2H6z"/>
                </svg>`;
        case "invite_user":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-envelope-plus" viewBox="0 0 16 16">
                    <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"/>
                    <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-3.5-2a.5.5 0 0 0-.5.5v1h-1a.5.5 0 0 0 0 1h1v1a.5.5 0 0 0 1 0v-1h1a.5.5 0 0 0 0-1h-1v-1a.5.5 0 0 0-.5-.5Z"/>
                </svg>`;
        case "arrow_down":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-arrow-90deg-down" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.854 14.854a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V3.5A2.5 2.5 0 0 1 6.5 1h8a.5.5 0 0 1 0 1h-8A1.5 1.5 0 0 0 5 3.5v9.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4z"/>
                </svg>`;
        case "prepsheet-item":
        case "check":
            return html`
            <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>`;
        case "spedometer":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-speedometer" viewBox="0 0 16 16">
                    <path d="M8 2a.5.5 0 0 1 .5.5V4a.5.5 0 0 1-1 0V2.5A.5.5 0 0 1 8 2zM3.732 3.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 8a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 8zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 7.31A.91.91 0 1 0 8.85 8.569l3.434-4.297a.389.389 0 0 0-.029-.518z"/>
                    <path fill-rule="evenodd" d="M6.664 15.889A8 8 0 1 1 9.336.11a8 8 0 0 1-2.672 15.78zm-4.665-4.283A11.945 11.945 0 0 1 8 10c2.186 0 4.236.585 6.001 1.606a7 7 0 1 0-12.002 0z"/>
                </svg>`;
        case "dot":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-circle-fill" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="8"/>
                </svg>`;
        case "event_type_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-globe" viewBox="0 0 16 16">
                    <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/>
                </svg>`;
        case "x":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                </svg>`;
        case "notify-active":
        case "alert_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                </svg>`;
        case "notify-inactive":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-bell-slash" viewBox="0 0 16 16">
                    <path d="M5.164 14H15c-.299-.199-.557-.553-.78-1-.9-1.8-1.22-5.12-1.22-6 0-.264-.02-.523-.06-.776l-.938.938c.02.708.157 2.154.457 3.58.161.767.377 1.566.663 2.258H6.164l-1 1zm5.581-9.91a3.986 3.986 0 0 0-1.948-1.01L8 2.917l-.797.161A4.002 4.002 0 0 0 4 7c0 .628-.134 2.197-.459 3.742-.05.238-.105.479-.166.718l-1.653 1.653c.02-.037.04-.074.059-.113C2.679 11.2 3 7.88 3 7c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0c.942.19 1.788.645 2.457 1.284l-.707.707zM10 15a2 2 0 1 1-4 0h4zm-9.375.625a.53.53 0 0 0 .75.75l14.75-14.75a.53.53 0 0 0-.75-.75L.625 15.625z"/>
                </svg>`;
        case "geo":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-geo" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.319 1.319 0 0 0-.37.265.301.301 0 0 0-.057.09V14l.002.008a.147.147 0 0 0 .016.033.617.617 0 0 0 .145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.414c.378-.126.648-.265.813-.395a.619.619 0 0 0 .146-.15.148.148 0 0 0 .015-.033L12 14v-.004a.301.301 0 0 0-.057-.09 1.318 1.318 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465-1.281 0-2.462-.172-3.34-.465-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411z"/>
                </svg>`;
        case "edit":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>`;
        case "arrow-expand":  
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-arrow-expand" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8ZM7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2ZM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10Z"/>
                </svg>`;
        case "arrow-collapse":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-arrow-collapse" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8Zm7-8a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0Zm-.5 11.707-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-1 0v-3.793Z"/>
                </svg>`;
        case "plus":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                </svg>`;
        case "arrow-short":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-arrow-up-short" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5"/>
                </svg>`;
        case "menu-button":
            return html`
                <svg id="i1" width="30" height="22.5" class="icon" viewBox="0 0 60 45">
                    <path id="top-line-1" d="M10,10 L50,10 Z"></path>
                    <path id="middle-line-1" d="M10,23 L50,23 Z"></path>
                    <path id="bottom-line-1" d="M10,36 L50,36 Z"></path>
                </svg>`;
        case "logo-mobile":
            return html`
                <svg width="14" height="14" viewBox="0 0 15.279 12.987">
                    <path d="M8.111,15.987V11.4h3.056v4.584h3.82V9.875h2.292L9.639,3,2,9.875H4.292v6.111Z" transform="translate(-2 -3)" fill="#8f959a"/>
                </svg>`;
        case "logo-dt":
            return html`
                <svg width="14" height="14" viewBox="0 0 15.279 12.987">
                    <path d="M8.111,15.987V11.4h3.056v4.584h3.82V9.875h2.292L9.639,3,2,9.875H4.292v6.111Z" transform="translate(-2 -3)" fill="#8f959a"/>
                </svg>`;
        case "search":
            return html`
                <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>`;
        case "cancel":
            return html`
                <svg viewBox="0 0 13 12.911">
                    <path d="M4,11H7.8V5H4Zm0,7H7.8V12H4Zm4.557,0h3.8V12h-3.8Zm4.557,0h3.8V12h-3.8ZM8.557,11h3.8V5h-3.8Zm4.557-6v6h3.8V5Z" transform="translate(-5 16.911) rotate(-90)" fill="#8f959a"/>
                </svg>`;
        case "activity":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2Z"/>
                </svg>`;
        case "search":
            return html`
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="25" y1="25" x2="16.65" y2="16.65"></line>
                </svg>`;
        case "arrow-left":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>`;
        case "arrow-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                </svg>`;
        case "arrow-right-square":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
                </svg>`;
        case "caret-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M6 12.796V3.204L11.481 8 6 12.796zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753z"/>
                </svg>`;
        case "chevron-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>`;
        case "twitter":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                </svg>`;
        case "instagram":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                </svg>`;
        case "user":
            return html`
                <svg ${attributes}  fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>`;
        case "lock":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/>
                    <path d="M9.5 6.5a1.5 1.5 0 0 1-1 1.415l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99a1.5 1.5 0 1 1 2-1.415z"/>
                </svg>`;
        case "email":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                </svg>
                `;
        case "user-fill":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                </svg>
                `;
        case "lock-fill":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5z"/>
                </svg>
                `;
        case "confirm-fill":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm2.146 5.146a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647z"/>
                </svg>
                `;
        case "inverse-smile":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0-1a8 8 0 1 1 0 16A8 8 0 0 1 8 0z"/>
                    <path d="M4.285 6.433a.5.5 0 0 0 .683-.183A3.498 3.498 0 0 1 8 4.5c1.295 0 2.426.703 3.032 1.75a.5.5 0 0 0 .866-.5A4.498 4.498 0 0 0 8 3.5a4.5 4.5 0 0 0-3.898 2.25.5.5 0 0 0 .183.683zM7 9.5C7 8.672 6.552 8 6 8s-1 .672-1 1.5.448 1.5 1 1.5 1-.672 1-1.5zm4 0c0-.828-.448-1.5-1-1.5s-1 .672-1 1.5.448 1.5 1 1.5 1-.672 1-1.5z"/>
                </svg>`;
        case "anicon":
            return html`
                `;
        case "anicon":
            return html`
                `;
        case "anicon":
            return html`
                `;
        case "check":
            return html`
                <svg id="auth-check" class="auth-svg" viewBox="0 0 130.2 130.2">
                    <polyline class="check" points="100.2,40.2 51.5,88.8 29.8,67.5 "/>
                </svg>`;
        case "x":
            return html`
                <svg id="auth-x" class="auth-svg" viewBox="0 0 130.2 130.2">
                    <line class="x" x1="34.4" y1="37.9" x2="95.8" y2="92.3"/>
                    <line class="x" x1="95.8" y1="38" x2="34.4" y2="92.2"/>
                </svg>`;
        case "+":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                </svg>`;
        case "dot":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                </svg>`;
        case "trend-down":
            return html`
                <svg ${attributes} viewBox="0 0 512 512">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M352 368h112V256"/>
                    <path d="M48 144l121.37 121.37a32 32 0 0045.26 0l50.74-50.74a32 32 0 0145.26 0L448 352" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                </svg>`;

        case "trend-up":
            return html`
                <svg ${attributes} viewBox="0 0 512 512">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M352 144h112v112"/>
                    <path d="M48 368l121.37-121.37a32 32 0 0145.26 0l50.74 50.74a32 32 0 0045.26 0L448 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                </svg>`;
        case "trend-flat":
            return html`
                <svg ${attributes} viewBox="0 0 512 512">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M400 256H112"/>
                </svg>`;
        case "nav-home":
            return html`
                <svg ${attributes} viewBox="0 0 16 16" fill="none">
                    <path class="unselected" d="M8.35355 1.14645C8.15829 0.951184 7.84171 0.951184 7.64645 1.14645L1.64645 7.14645C1.55268 7.24021 1.5 7.36739 1.5 7.5V14.5C1.5 14.7761 1.72386 15 2 15H6.5C6.77614 15 7 14.7761 7 14.5V10.5H9V14.5C9 14.7761 9.22386 15 9.5 15H14C14.2761 15 14.5 14.7761 14.5 14.5V7.5C14.5 7.36739 14.4473 7.24021 14.3536 7.14645L13 5.79289V2.5C13 2.22386 12.7761 2 12.5 2H11.5C11.2239 2 11 2.22386 11 2.5V3.79289L8.35355 1.14645ZM2.5 14V7.70711L8 2.20711L13.5 7.70711V14H10V10C10 9.72386 9.77614 9.5 9.5 9.5H6.5C6.22386 9.5 6 9.72386 6 10V14H2.5Z"/>
                    <path class="selected" d="M6.5 14.5V10.9947C6.5 10.75 6.75 10.5 7 10.5H9C9.25 10.5 9.5 10.75 9.5 11V14.5C9.5 14.7761 9.72386 15 10 15H14C14.2761 15 14.5 14.7761 14.5 14.5V7.5C14.5 7.36739 14.4473 7.24021 14.3536 7.14645L13 5.79289V2.5C13 2.22386 12.7761 2 12.5 2H11.5C11.2239 2 11 2.22386 11 2.5V3.79289L8.35355 1.14645C8.15829 0.951184 7.84171 0.951184 7.64645 1.14645L1.64645 7.14645C1.55268 7.24021 1.5 7.36739 1.5 7.5V14.5C1.5 14.7761 1.72386 15 2 15H6C6.27614 15 6.5 14.7761 6.5 14.5Z"/>
                </svg>`;
        case "nav-ownership":
            return html`
                <svg ${attributes} viewBox="0 0 16 16">
                    <path class="stroked" fill-rule="evenodd" d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5zm14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5z"/>
                </svg>`;
        case "nav-whale":
            return html`
                <svg ${attributes} viewBox="0 0 17 16" fill="none">
                    <path class="unselected" d="M8.00004 0L14.6099 3H15.5C15.7762 3 16 3.22386 16 3.5L16 5.5C16 5.77614 15.7761 6 15.5 6H15L15 13C15.2295 13 15.4295 13.1574 15.4851 13.38L15.9851 15.38C16.0224 15.5294 15.9889 15.6886 15.8941 15.81C15.7994 15.9314 15.654 16 15.5 16H0.500035C0.346068 16 0.200686 15.9314 0.105933 15.81C0.011179 15.6886 -0.0223786 15.5294 0.014964 15.38L0.514964 13.38C0.57061 13.1574 0.770601 13 1.00004 13L1 6H0.5C0.223858 6 0 5.77614 0 5.5L3.52859e-05 3.5C3.52859e-05 3.22386 0.223893 3 0.500035 3H1.39022L8.00004 0ZM3.77652 3H12.2235L8.00004 1L3.77652 3ZM2 6L2.00004 13H3.00004L3 6H2ZM4 6L4.00004 13H6.50004L6.5 6H4ZM7.5 6L7.50004 13H8.50004L8.5 6H7.5ZM9.5 6L9.50004 13H12L12 6H9.5ZM13 6L13 13H14V6H13ZM15 5V4H1.00004V5H15ZM14.6096 14H1.39042L1.14042 15H14.8596L14.6096 14Z"/>
                    <path class="selected" d="M8.00004 0L14.6099 3H15.5C15.7762 3 16 3.22386 16 3.5L16 5.5C16 5.77614 15.7761 6 15.5 6H15L15 13C15.2295 13 15.4295 13.1574 15.4851 13.38L15.9851 15.38C16.0224 15.5294 15.9889 15.6886 15.8941 15.81C15.7994 15.9314 15.654 16 15.5 16H0.500035C0.346068 16 0.200686 15.9314 0.105933 15.81C0.011179 15.6886 -0.0223786 15.5294 0.014964 15.38L0.514964 13.38C0.57061 13.1574 0.770601 13 1.00004 13L1 6H0.5C0.223858 6 0 5.77614 0 5.5L3.52859e-05 3.5C3.52859e-05 3.22386 0.223893 3 0.500035 3H1.39022L8.00004 0ZM3.5 6V13H6.70937V9.56254V6H3.5ZM9.30894 6V13H12.5V6H9.30894Z"/>
                </svg>`;
        case "nav-leader":
            return html`
                <svg ${attributes} viewBox="0 0 16 16" fill="none">
                    <path class="unselected" d="M15 14C15 14 16 14 16 13C16 12 15 9 11 9C7 9 6 12 6 13C6 14 7 14 7 14H15ZM7.02235 13C7.01888 12.9996 7.01403 12.999 7.00815 12.998C7.00538 12.9975 7.00266 12.997 7.00001 12.9965C7.00146 12.7325 7.16687 11.9669 7.75926 11.2758C8.31334 10.6294 9.28269 10 11 10C12.7173 10 13.6867 10.6294 14.2407 11.2758C14.8331 11.9669 14.9985 12.7325 15 12.9965C14.9973 12.997 14.9946 12.9975 14.9919 12.998C14.986 12.999 14.9811 12.9996 14.9777 13H7.02235Z"/>
                    <path class="unselected" d="M11 7C12.1046 7 13 6.10457 13 5C13 3.89543 12.1046 3 11 3C9.89543 3 9 3.89543 9 5C9 6.10457 9.89543 7 11 7ZM14 5C14 6.65685 12.6569 8 11 8C9.34315 8 8 6.65685 8 5C8 3.34315 9.34315 2 11 2C12.6569 2 14 3.34315 14 5Z"/>
                    <path class="unselected" d="M6.93593 9.27996C6.56813 9.16232 6.15954 9.07679 5.70628 9.03306C5.48195 9.01141 5.24668 9 5 9C1 9 0 12 0 13C0 13.6667 0.333333 14 1 14H5.21636C5.07556 13.7159 5 13.3791 5 13C5 11.9897 5.37724 10.958 6.08982 10.0962C6.33327 9.80174 6.61587 9.52713 6.93593 9.27996ZM4.92004 10.0005C4.32256 10.9136 4 11.9547 4 13H1C1 12.7393 1.16424 11.97 1.75926 11.2758C2.30468 10.6395 3.25249 10.0197 4.92004 10.0005Z"/>
                    <path class="unselected" d="M1.5 5.5C1.5 3.84315 2.84315 2.5 4.5 2.5C6.15685 2.5 7.5 3.84315 7.5 5.5C7.5 7.15685 6.15685 8.5 4.5 8.5C2.84315 8.5 1.5 7.15685 1.5 5.5ZM4.5 3.5C3.39543 3.5 2.5 4.39543 2.5 5.5C2.5 6.60457 3.39543 7.5 4.5 7.5C5.60457 7.5 6.5 6.60457 6.5 5.5C6.5 4.39543 5.60457 3.5 4.5 3.5Z"/>

                    <path class="selected" d="M7 14C7 14 6 14 6 13C6 12 7 9 11 9C15 9 16 12 16 13C16 14 15 14 15 14H7Z"/>
                    <path class="selected" d="M11 8C12.6569 8 14 6.65685 14 5C14 3.34315 12.6569 2 11 2C9.34315 2 8 3.34315 8 5C8 6.65685 9.34315 8 11 8Z"/>
                    <path class="selected" fill-rule="evenodd" clip-rule="evenodd" d="M5.21636 14C5.07556 13.7159 5 13.3791 5 13C5 11.6445 5.67905 10.2506 6.93593 9.27997C6.3861 9.10409 5.7451 9 5 9C1 9 0 12 0 13C0 14 1 14 1 14H5.21636Z"/>
                    <path class="selected" d="M4.5 8C5.88071 8 7 6.88071 7 5.5C7 4.11929 5.88071 3 4.5 3C3.11929 3 2 4.11929 2 5.5C2 6.88071 3.11929 8 4.5 8Z"/>
                </svg>`;
        case "✔":
            return html`
                <svg ${attributes} viewBox="0 0 130.2 130.2">
                    <polyline class="polyline-check" points="100.2,40.2 51.5,88.8 29.8,67.5 "/>
                </svg>`;
        case "✖":
            return html`
            <svg ${attributes} viewBox="0 0 130.2 130.2">
                <line class="line-x" x1="34.4" y1="37.9" x2="95.8" y2="92.3"/>
                <line class="line-x" x1="95.8" y1="38" x2="34.4" y2="92.2"/>
            </svg>`;
        case "spinner":
            return html`
                <svg ${attributes} viewBox="0 0 48 48">
                    <circle cx="24" cy="4" r="4" fill="#fff"/>
                    <circle cx="12.19" cy="7.86" r="3.7" fill="#fffbf2"/>
                    <circle cx="5.02" cy="17.68" r="3.4" fill="#fef7e4"/>
                    <circle cx="5.02" cy="30.32" r="3.1" fill="#fef3d7"/>
                    <circle cx="12.19" cy="40.14" r="2.8" fill="#feefc9"/>
                    <circle cx="24" cy="44" r="2.5" fill="#feebbc"/>
                    <circle cx="35.81" cy="40.14" r="2.2" fill="#fde7af"/>
                    <circle cx="42.98" cy="30.32" r="1.9" fill="#fde3a1"/>
                    <circle cx="42.98" cy="17.68" r="1.6" fill="#fddf94"/>
                    <circle cx="35.81" cy="7.86" r="1.3" fill="#fcdb86"/>
                </svg>`;
        case "background":
                return html`
                    <svg class="svg-background" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
                        <defs>
                            <linearGradient id="a">
                                <stop offset="0%" style="stop-color:rgba(130,158,249,.06)"/>
                                <stop offset="50%" style="stop-color:rgba(76,190,255,.6)"/>
                                <stop offset="100%" style="stop-color:rgba(115,209,72,.2)"/>
                            </linearGradient>
                            <path id="b" fill="url(#a)" d="M-363.852 502.589s236.988-41.997 505.475 0 371.981 38.998 575.971 0 293.985-39.278 505.474 5.859 493.475 48.368 716.963-4.995v560.106H-363.852v-560.97z"/>
                        </defs>
                        <use xlink:href="#b" opacity=".3">
                            <animateTransform attributeName="transform" attributeType="XML" type="translate" dur="160s" calcMode="spline" values="270 230; -334 180; 270 230" keyTimes="0; .5; 1" keySplines="0.42, 0, 0.58, 1.0;0.42, 0, 0.58, 1.0" repeatCount="indefinite"/>
                        </use>
                        <use xlink:href="#b" opacity=".6">
                            <animateTransform attributeName="transform" attributeType="XML" type="translate" dur="120s" calcMode="spline" values="-270 230;243 220;-270 230" keyTimes="0; .6; 1" keySplines="0.42, 0, 0.58, 1.0;0.42, 0, 0.58, 1.0" repeatCount="indefinite"/>
                        </use>
                        <use xlink:href="#b" opacity=".4">
                            <animateTransform attributeName="transform" attributeType="XML" type="translate" dur="80s" calcMode="spline" values="0 230;-140 200;0 230" keyTimes="0; .4; 1" keySplines="0.42, 0, 0.58, 1.0;0.42, 0, 0.58, 1.0" repeatCount="indefinite"/>
                        </use>
                    </svg>`;
        default:
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-diamond" viewBox="0 0 16 16">
                    <path d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.482 1.482 0 0 1 0-2.098L6.95.435zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134z"/>
                </svg>`;
    }
}

// Step 1: Extract Keys from get_svg Function
function extract_svg_keys() {
    const keys = [];
    // Assuming get_svg is defined in the scope
    const get_svg_str = get_svg.toString();
    const case_regex = /case\s+"([^"]+)":/g;
    let match;

    while ((match = case_regex.exec(get_svg_str)) !== null) {
        keys.push(match[1]);
    }

    return keys;
}

// Step 2: Create Container Element Dynamically
function create_container_element() {
    const container = document.createElement('div');
    container.id = 'svg-container';
    document.body.appendChild(container);
    return container;
}

// Step 3: Retrieve SVG HTML and Inject into Container
function display_svgs() {
    const keys = extract_svg_keys();
    const container = create_container_element();

    keys.forEach(key => {
        const svg_html = get_svg(key);
        const svg_container = document.createElement('div');
        svg_container.innerHTML = `<h4>${key}</h4>${svg_html}`;
        svg_container.style.display = 'inline-block';
        svg_container.style.margin = '10px';
        container.appendChild(svg_container);
    });
}

function loader(class_string = "loading-a"){
    return html`
        <div class="${class_string}">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="margin: auto; display: block; shape-rendering: auto;" width="200px" height="200px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
                <g transform="translate(80,50)">
                <g transform="rotate(0)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="1">
                <animateTransform attributeName="transform" type="scale" begin="-0.875s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.875s"></animate>
                </circle>
                </g>
                </g><g transform="translate(71.21320343559643,71.21320343559643)">
                <g transform="rotate(45)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.875">
                <animateTransform attributeName="transform" type="scale" begin="-0.75s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.75s"></animate>
                </circle>
                </g>
                </g><g transform="translate(50,80)">
                <g transform="rotate(90)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.75">
                <animateTransform attributeName="transform" type="scale" begin="-0.625s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.625s"></animate>
                </circle>
                </g>
                </g><g transform="translate(28.786796564403577,71.21320343559643)">
                <g transform="rotate(135)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.625">
                <animateTransform attributeName="transform" type="scale" begin="-0.5s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.5s"></animate>
                </circle>
                </g>
                </g><g transform="translate(20,50.00000000000001)">
                <g transform="rotate(180)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.5">
                <animateTransform attributeName="transform" type="scale" begin="-0.375s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.375s"></animate>
                </circle>
                </g>
                </g><g transform="translate(28.78679656440357,28.786796564403577)">
                <g transform="rotate(225)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.375">
                <animateTransform attributeName="transform" type="scale" begin="-0.25s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.25s"></animate>
                </circle>
                </g>
                </g><g transform="translate(49.99999999999999,20)">
                <g transform="rotate(270)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.25">
                <animateTransform attributeName="transform" type="scale" begin="-0.125s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.125s"></animate>
                </circle>
                </g>
                </g><g transform="translate(71.21320343559643,28.78679656440357)">
                <g transform="rotate(315)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.125">
                <animateTransform attributeName="transform" type="scale" begin="0s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="0s"></animate>
                </circle>
                </g>
                </g>
            </svg>
        </div>`;
}
