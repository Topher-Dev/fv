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
                <div class="event-info d--f ai--c jc--sb">
                    <div>
                        <p>Start Time: ${event_details.StartTime}</p>
                        <p>Event Zone: ${event_details.TimeZone}</p>
                        <p>Event Status: ${event_details.Status}</p>
                    </div>
                    <div>
                        <p>State: ${event_details.Location.State}</p>
                        <p>City: ${event_details.Location.City}</p>
                        <p>Venue: ${event_details.Location.Venue}</p>
                    </div>
                </div>
                <div class="ai--fe d--f event-list-manager fd--c">
                    ${get_svg("caret-down-fill", 'style="fill:#585b63"')}
                </div>
                <ul class="event-fight-list">
                    ${event_details.FightCard.map( (li, fi) => {
                        return html`
                        <li 
                            data-fight-id="${li.FightId}" 
                            onclick="select_fight()" 
                            class="d--f fd--r ai--c jc--c fight"
                        >
                            <div class="fight-tracker ps--a">${fi + 1}</div>${li.Fighters.map( (fighter, i) => {
                                const src = `images/fighter/headshot/${fighter.UFCLink.split("athlete/")[1]}.png`.toLowerCase();
                                return html`
                                    <div class="fighter d--f jc--sb ai--c ${i===0?"fd--rr":"fd--r"}">
                                        <div class="fight-list-img-containor">
                                            <img class="fight-list-img" src="${src}" alt="xx"></div>
                                        <div class="d--f fd--c ai--c">
                                            <p class="fight-list-name">${fighter.Name.LastName}</p>
                                            <p style="font-size: 1.2rem;margin-top: .25rem;">10-0-0</p>
                                        </div>
                                        <img class="fight-list-flag as--fs" src="images/flags/us.png" >
                                    </div>`;})}
                        </li>`
                    })}
                </ul>
            `;
        },
        listeners :{
            select_fight: function(event){
                console.log(event)
                const li = event.target.closest("li");
                const fight_id = li.dataset.fightId;
                console.log(fight_id);
                app.mods.view.change("ufc_fight", {fight_id});
            }
        },
        setters: setters.CRUD(UFC_EVENT, READ_ONE)
    });

    return ufc_event.do("fetch"), ufc_event;
}

function view_ufc_fight({ fight_id }){
    const ufc_fight = new Component('main', {
        data: {
            id: null,
            fight_id,
            header: "fight"
        },
        template: function(props) {

            if (this.isLoading){
                return loader();
            }

            const fighters = JSON.parse(props.form.data.data)['Fighters'];

            console.log(props)
            return html`
                <div class="fighter-heroshots d--f jc--sa">
                    ${fighters.map( (fighter, i) => {
                        const src = `images/fighter/heroshot/${fighter.UFCLink.split("athlete/")[1]}.png`.toLowerCase();
                        return html`<img class="fighter-heroshot" src="${src}" alt="xx">`;
                    })}
                </div>`;
        },
        listeners :{
        },
        setters: {
            fetch: async function(){
                this.isLoading = true;
                const fight = await arc.get(UFC_FIGHT, READ_ONE, {fight_fmid: this.data.fight_id});
                console.log(fight)
                this.isLoading = false;
                this.data.form = fight;
                this.render();
            }
        }
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
