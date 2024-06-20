
// document.addEventListener('keydown', function(event) {


//     // //console.log("Key press", event.key);
//     if (Q('.header-menu.active.alerts')){

//         const index = Number(app.menu.alerts.data.selected_li_index);
//         let should_update_ui = false;
//         let li;

//         if (event.key === "ArrowUp" && index != 0){
//             event.preventDefault();
//             li = app.menu.alerts.elem.querySelector(`li[data-index="${index - 1}"]`);
//             should_update_ui = true;
//         }

//         if (event.key === "ArrowDown" && index != (app.menu.alerts.data.list.length - 1)){
//             event.preventDefault();
//             li = app.menu.alerts.elem.querySelector(`li[data-index="${index + 1}"]`);
//             should_update_ui = true;
//         }

//         if (should_update_ui){
//             li.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
//             li.click();
//         }

//         //if the enter key is pressed
//         if (event.key === "Enter"){
//             event.preventDefault();

//             app.menu.alerts.data.selected_li_index = parseInt(index);
//             app.menu.alerts.render();
//             //if a double click change view

//             const { id, view } = JSON.parse(app.menu.alerts.data.list[index].data)
//             // console.log(id, view);
//             if (!id || !view) {
//                 return;
//             };


//             app.view.change(view, { id });
//             return;

//         }

//         //if the escape key is pressed
//         if (event.key === "Escape"){
//             event.preventDefault();
//             //simulate a click on the parent element of #menu-containor
//             Q('#menu-containor').closest('body').click();
//         }

//         return;
//     }

//     if(event.ctrlKey && event.key === 'b') {
//         //console.log("Ctrl + B was pressed");
//         listeners.CORE().reload(event)
//         return;
//         // You can add your code here
//     }

//     if(event.ctrlKey && event.key === 'm') {
//         //console.log("Ctrl + M was pressed");

//         app.modal.open("Add Prepsheet", modal_add_prepsheet);
//         return;
//         // You can add your code here
//     }

//     if (event.key === 'Enter') {
      
      
//       //check if target is  an input element with class accept-enter-press
//         const target = document.activeElement;
//         //console.log(target.tagName, target, target.closest('.select-manage'));
//         if (target.tagName ==='INPUT' && target.closest('.select-manage')) {
            
//             const select_manage = target.closest('.select-manage');

//             if (target.classList.contains('selected-option')) {
//                 //close the select manage and unfocus the input
//                 select_manage.querySelector(".select-options-containor").classList.remove('active');
//                 target.blur();
//                 event.preventDefault();
//             }


//             if (target.classList.contains('select-options-add-input')){

//                 const bound_method = app.view.active.component._listeners.add_option.bind(app.view.active.component);
//                 bound_method(event);
//             }

//             return;
//         }

//         const buttons = document.querySelectorAll('.accept-enter-press');
        
//         if (buttons.length === 1) {

//             const button = buttons[0];

//             if (!button.disabled) {
            
//                 //console.log(button);
//                 event.preventDefault();
//                 if (app.view.active.name === 'prepsheet_list'){
//                     const mousedownEvent = new MouseEvent('mousedown', {
//                         bubbles: true,
//                         cancelable: true,
//                 });

//                 const mouseupEvent = new MouseEvent('mouseup', {
//                     bubbles: true,
//                     cancelable: true,
//                 });
                
//                 // Dispatch the mousedown event on the element
//                 button.dispatchEvent(mousedownEvent);
//                 button.dispatchEvent(mouseupEvent);

//             } else {
//                 button.click();
//                 button.disabled = true;
//             }

            
//             }
//         } else if (buttons.length === 0) {
//             // Do nothing
//         } else {
//             throw new Error('More than one button found with class .accept-enter-press');
//         }

//         return;
//     }

//     //allow backspace when we do not have any input type elements focused to go back
//     if (event.key === 'Backspace' && !document.querySelector('input:focus, textarea:focus, select:focus')){
        

//         const back_button = Q('button[data-return-view]')
//         if (back_button){
//             event.preventDefault();
//             back_button.click();
//             return;
//         }

//     }

//     //allow escape to close modal
//     if (event.key === 'Escape'){
        
//         const modal = Q('#modal-overlay');

//         if (modal.classList.contains('active')){
//             event.preventDefault();
//             Q("#modal-close-button").click();
//             return;
//         }
//     }

//     if (app.view.active.name === 'prepsheet_list'){

//         // const focused = document.querySelector('input:focus, textarea:focus, select:focus');
//         // if (focused){
//         //     return;
//         // }

//         if (event.key === 'ArrowRight') {

//             const bound_method = app.view.active.component._listeners.page_next.bind(app.view.active.component);
//             bound_method(event);
//             return;
//         }

//         if (event.key === 'ArrowLeft') {
//             const bound_method = app.view.active.component._listeners.page_prev.bind(app.view.active.component);
//             bound_method(event);
//             return;
//         }
    


//         if (!(event.key === "ArrowUp") && !(event.key === "ArrowDown")) return;

//         let move_to_index;

//         const current_position = app.view.active.component.elem.querySelector(".accept-enter-press");
//         const rows = app.view.active.component.elem.querySelectorAll("table.prepsheet-list > tbody > tr")

//         if (!rows){
//             return //console.log("Failed to gather rows");
//         }

//         //add
//         if (!current_position){
//             move_to_index = 0;
//             event.preventDefault();
//             return rows[move_to_index].classList.add("accept-enter-press");
//         }

//         const current_index = Number(current_position.dataset.rowIndex);
//             // //console.log(current_index, current_position);
//             // //console.log(event.key === "ArrowUp" && current_index == 0)
//         if (event.key === "ArrowUp" && current_index === 0) return;
//         if (event.key === "ArrowDown" && current_index === (rows.length - 1)) return;



//         current_position.classList.remove("accept-enter-press")

       
//         if (event.key === "ArrowUp"){
//             move_to_index = current_index - 1;
//         }
    
//         if (event.key === "ArrowDown"){
//             move_to_index = current_index + 1;
//         }
 
//         rows[move_to_index].classList.add("accept-enter-press");        

//         event.preventDefault();
//     }

// });
