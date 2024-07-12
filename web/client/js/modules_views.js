function view_ufc_event({ selected_event }){
    const ufc_event = new Component('main', {
        data: {
            header: "event",
            id: selected_event.id
        },
        template: function(props) {

            if (this.isLoading || !props?.form){
                return loader();
            }
            console.log(props);
            const event_details = JSON.parse(props.form.data)['LiveEventDetail'];

            console.log(event_details)
            return html`
                <div class="event-info">
                    <h3>Event Info</h3>
                    <p>Location</p>
                    <p>Something Intresting</p>
                </div>
                <hr class="divider">
                <ul class="event-fight-list">
                    ${event_details.FightCard.map( li => {
                        return html`<li data-fight-id="${li.Status}" onclick="select_fight()" class="fight">${li.Status} | ${li.CardSegmentStartTime
                        }</li>`
                    })}
                </ul>
            `;
        },
        listeners :{
            select_fight: function(event){
                console.log(event)

                const id = event.target.dataset.fightId;
                console.log(id);
                app.mods.view.change("ufc_fight", {id});
            }
        },
        setters: setters.CRUD(UFC_EVENT, READ_ONE)
    });

    return ufc_event.do("fetch"), ufc_event;
}

function view_ufc_fight({ id }){
    const ufc_fight = new Component('main', {
        data: {
            id,
            header: "fight"
        },
        template: function(props) {

            if (this.isLoading){
                return loader();
            }
            console.log(props)
            return html`
                <div>
                    ${props.header}
                    ${props.form.fighter_1_url}
                    vs
                    ${props.form.fighter_2_url}
                </div>`;
        },
        listeners :{
        },
        setters: setters.CRUD(UFC_FIGHT, READ_ONE)
    });

    return ufc_fight.do("fetch"), ufc_fight;
}

function view_ufc_fighter(){
    const ufc_fighter = new Component('main', {
        data: {
            header: "fighter"
        },
        template: function(props) {

            if (this.isLoading || !props?.form){
                return loader();
            }


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
