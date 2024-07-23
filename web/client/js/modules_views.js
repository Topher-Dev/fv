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

    const chart_options = {
        responsive: true,
        legend: {
            // position: 'top',
            display: false
        },
        plugins: {
            tooltips: {
                enabled: false
             },
            title: {
                display: false,
                text: 'UFC Betting Odds Over Time'
            }
        },
        scales: {
            x: {
                title: {
                    display: false,
                    text: 'Date'
                }
            },
            y: {
                title: {
                    display: false,
                    text: 'Odds'
                },
                beginAtZero: false
            }
        }
    };

    const chart_data = {
        labels: ['07-01', '07-02', '07-03', '07-04', '07-05'],
        datasets: [
            {
                label: 'Fighter A',
                data: [1.5, 1.6, 1.4, 1.3, 1.5],
                borderColor: 'rgba(210, 179, 13, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
                tension: 0.1
            },
            {
                label: 'Fighter B',
                data: [2.0, 2.1, 1.9, 2.2, 2.0],
                borderColor: 'rgba(149, 149, 149, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: false,
                tension: 0.1
            }
        ]
    };

    const ufc_fight = new Component('main', {
        data: {
            id: null,
            fight_id,
            header: "fight",
            odds: [
                {name: "Sherdog", odds: "2.3 : .5"},
                {name: "UFC", odds: "2.3 : .5"},
                {name: "Bet365", odds: "2.3 : .5"},
                {name: "Vegas", odds: "2.3 : .5"},
                {name: "Vegas", odds: "2.3 : .5"}
            ],
            chart : null,
        },
        template: function(props) {

            if (this.isLoading){
                return loader();
            }

            const fighters = props.fight.Fighters
            const fighter_1 = fighters[0];
            const fighter_2 = fighters[1];

            const fighter_1_heroshot_src = `images/fighter/heroshot/${fighter_1.UFCLink.split("athlete/")[1]}.png`.toLowerCase();
            const fighter_2_heroshot_src = `images/fighter/heroshot/${fighter_2.UFCLink.split("athlete/")[1]}.png`.toLowerCase();

            return html`
                <div class="fight-odds d--f ai--c jc--sb">
                    ${props.odds.map( odd => {
                        return html`
                            <div onclick="toggle_chart()" class="fight-odds-item d--f fd--c ai--c jc--c">
                                <p>${odd.name}</p>
                                <p>${odd.odds}</p>
                            </div>`;
                    })}
                </div>
                <div class="event-list-manager ai--c d--f jc--sb">
                    <div class="d--f ai--c g--sm jc--c">
                        ${get_svg("wreath", 'class="svg-wreath favourite"')}
                        <p class="fighter-name">${fighter_1.Name.FirstName} ${fighter_1.Name.LastName}</p>
                    </div>
                    <p>v</p>
                    <div class="d--f ai--c g--sm jc--c">
                        <p class="fighter-name">${fighter_2.Name.FirstName} ${fighter_2.Name.LastName}</p>
                        ${get_svg("wreath", 'class="svg-wreath underdog"')}
                    </div>
                </div>
                <div class="fighter-details d--f jc--sa ai--fs">
                    <div class="fight-odds-chart-containor">
                        <canvas id="fight-odds-chart"></canvas>
                    </div>
                    <div class="d--f jc--sb ai--fs" style="width: 100%;">
                        <div class="fighter-heroshot-containor">
                            <img class="fighter-heroshot" src="${fighter_1_heroshot_src}" alt="xx">
                        </div>
                        <div class="fighter-attributes">
                            <div>
                                <h3 class="ta--c">Age</h3>
                                <div class="d--f jc--sb">
                                    <p>${fighter_1.Age}</p>
                                    <p>${fighter_2.Age}</p>
                                </div>
                            </div>
                            <div>
                                <h3 class="ta--c">Height</h3>
                                <div class="d--f jc--sb">
                                    <p>${inches_to_feet(fighter_1.Height)}</p>
                                    <p>${inches_to_feet(fighter_2.Height)}</p>
                                </div>
                            </div>
                            <div>
                                <h3 class="ta--c">Weight</h3>
                                <div class="d--f jc--sb">
                                    <p>${fighter_1.Weight}</p>
                                    <p>${fighter_2.Weight}</p>
                                </div>
                            </div>
                            <div>
                                <h3 class="ta--c">Reach</h3>
                                <div class="d--f jc--sb">
                                    <p>${fighter_1.Reach}</p>
                                    <p>${fighter_2.Reach}</p>
                                </div>
                            </div>
                            <div>
                                <h3 class="ta--c">Record</h3>
                                <div class="d--f jc--sb">
                                    <p>${fighter_1.Record.Wins}-${fighter_1.Record.Losses}-${fighter_1.Record.Draws}</p>
                                    <p>${fighter_2.Record.Wins}-${fighter_2.Record.Losses}-${fighter_2.Record.Draws}</p>
                                </div>
                            </div>
                            <div>
                                <h3 class="ta--c">Stance</h3>
                                <div class="d--f jc--sb">
                                    <p>${fighter_1.Stance}</p>
                                    <p>${fighter_2.Stance}</p>
                                </div>
                            </div>
                        </div>
                        <div class="fighter-heroshot-containor">
                            <img class="fighter-heroshot" src="${fighter_2_heroshot_src}" alt="xx">
                        </div>
                    </div>
                </div>
                <div class="fight-analysis">
                    <p>Analysis</p>
                </div>`;
        },
        listeners :{
            toggle_chart: function(event){
                Q(".fight-odds-chart-containor").classList.toggle("active");
                event.target.classList.toggle("active");
                window['fight-odds-chart'].update({
                    duration: 800, // Duration of the animation in milliseconds
                    easing: 'easeOutBounce' // Easing function for the animation
                });
            }
        },
        setters: {
            fetch: async function(){
                this.isLoading = true;
                const response = await arc.get(UFC_FIGHT, READ_ONE, {fight_fmid: this.data.fight_id});
                this.isLoading = false;
                const fight = JSON.parse(response.data.data);
                this.data.fight = fight;
                this.render();
                this.do("create_chart");
            },
            create_chart: function(){
                const chart_config = config_chart("line", chart_data, chart_options);
                create_chart("fight-odds-chart", chart_config);
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
