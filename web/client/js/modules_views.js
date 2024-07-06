function view_ufc_event(){
    const ufc_event = new Component('main', {
        data: {
            header: "event"
        },
        template: function(props) {

            if (this.isLoading || !props?.list){
                return "loader()";
            }

            return html`
                <ul>
                    ${props.list.map( li => {
                        return html`<li>${li.id} | ${li.name}</li>`
                    })}
                </ul>
            `;
        },
        listeners :{},
        setters: setters.LIST(UFC_EVENT, READ_LIST)
    });

    return ufc_event.do("fetch"), ufc_event;
}

function view_ufc_fight(){
    const ufc_fight = new Component('main', {
        data: {
            header: "fight"
        },
        template: function(props) {
            return html`
                <div>
                    ${props.header}
                </div>
            `;
        },
        listeners :{
        }
    });

    return ufc_fight;
}

function view_ufc_fighter(){
    const ufc_fighter = new Component('main', {
        data: {
            header: "fighter"
        },
        template: function(props) {
            return html`
                <div>
                    ${props.header}
                </div>
            `;
        },
        listeners :{
        },
        setters: setters.LIST(UFC_FIGHTER, READ_LIST)
    });

    return ufc_fighter.do("fetch"), ufc_fighter;
}