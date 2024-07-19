function view_ufc_event({ selected_event }){
    const ufc_event = new Component('main', {
        data: {
            header: "event",
            id: selected_event.id,
            event: null
        },
        template: function(props) {

            if (this.isLoading || !props?.event){
                return loader();
            }
     
            const event_details = props.event;

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
        setters: {
            fetch: async function(){
                this.isLoading = true;
                const response = await arc.get(UFC_EVENT, READ_ONE, {id: this.data.id});
                console.log(response,"response")
                this.isLoading = false;
                //TODO DATE: 2024-18-07// fix this data.data crap
                this.data.event = JSON.parse(response.data.data)['LiveEventDetail'];
                this.render();
            }
        }
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

            /*
            
            
                        ${fighters.map( (fighter, i) => {
                const src = `images/fighter/heroshot/${fighter.UFCLink.split("athlete/")[1]}.png`.toLowerCase();
                return html`<img class="fighter-heroshot" src="${src}" alt="xx">`;
                <-- Refactor the above to usei ndex fighters[0] and fighters [1] -->
            })}
            */
            const fighter_1 = fighters[0];
            const fighter_2 = fighters[1];

            //get src's
            const fighter_1_heroshot_src = `images/fighter/heroshot/${fighter_1.UFCLink.split("athlete/")[1]}.png`.toLowerCase();
            const fighter_2_heroshot_src = `images/fighter/heroshot/${fighter_2.UFCLink.split("athlete/")[1]}.png`.toLowerCase();
            console.log(props)
            return html`
                <div class="fight-odds d--f ai--c jc--sb p--md">
                    <div>
                        <p>Sherdog</p>
                        <p>2.3 : .5</p>
                    </div>
                    <div>
                        <p>UFC</p>
                        <p>2.3 : .5</p>
                    </div>
                    <div>
                        <p>Bet365</p>
                        <p>2.3 : .5</p>
                    </div>
                    <div>
                        <p>Vegas</p>
                        <p>2.3 : .5</p>
                    </div>
                    <div>
                        <p>Vegas</p>
                        <p>2.3 : .5</p>
                    </div>
                </div>
                <div class="fighter-details d--f jc--sa ai--fs">
                    <div class="fighter-heroshot-containor">
                        <img class="fighter-heroshot" src="${fighter_1_heroshot_src}" alt="xx">
                    </div>
                    <div class="fighter-attributes">
                        <div class="fighter-1-attributes">
                            <p>${fighter_1.Name.FirstName} ${fighter_1.Name.LastName}</p>
                            <p>Age: ${fighter_1.Age}</p>
                            <p>Height: ${fighter_1.Height}</p>
                            <p>Weight: ${fighter_1.Weight}</p>
                            <p>Reach: ${fighter_1.Reach}</p>
                            <p>Record: ${fighter_1.Record}</p>
                            <p>Stance: ${fighter_1.Stance}</p>
                        </div>
                        <div class="fighter-2-attributes">
                            <p>${fighter_2.Name.FirstName} ${fighter_2.Name.LastName}</p>
                            <p>Age: ${fighter_2.Age}</p>
                            <p>Height: ${fighter_2.Height}</p>
                            <p>Weight: ${fighter_2.Weight}</p>
                            <p>Reach: ${fighter_2.Reach}</p>
                            <p>Record: ${fighter_2.Record}</p>
                            <p>Stance: ${fighter_2.Stance}</p>
                        </div>
                    </div>
                    <div class="fighter-heroshot-containor">
                        <img class="fighter-heroshot" src="${fighter_2_heroshot_src}" alt="xx">
                    </div>
                </div>
                <div class="fight-analysis">
                    <p>Analysis</p>
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
