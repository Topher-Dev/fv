function view_ufc_event({ selected_event }){
    const ufc_event = new Component('main', {
        data: {
            header: "event",
            id: selected_event.fmid,
            event: null
        },
        template: function(props) {

            if (this.is_loading || !props?.event){
                return loader();
            }
     
            const event_details = props.event;

            console.log(event_details)
            return html`
                <div class="event-info d--f ai--c jc--sb hide">
                    <div>
                        <p>Location: ${event_details.Location.State}, ${event_details.Location.City}</p>
                        <p>Venue: ${event_details.Location.Venue}</p>
                    </div>
                    <div>
                        <p>Zone: ${event_details.TimeZone}</p>
                        <p>Status: ${event_details.Status}</p>
                    </div>
                </div>
                <div class="event-list-manager d--f fd--r ai--c jc--sb">
                    <div class="event-time d--f fd--r ai--c g--xs">
                        ${get_svg("date", 'class="svg-date"')}
                        <p>${event_details.StartTime.substring(0,10)}</p>
                    </div>
                    <div onclick="toggle_drawer()" class="event-list-dir d--f fd--r ai--c jc--sb g--sm">
                        ${get_svg('plus', 'class="svg-plus"')}
                    </div>
                </div>
                <ul class="event-fight-list">
                    ${event_details.FightCard.map( (li, fi) => {
                        //get first chart of card segment + fight order
                        const fight_order = `${li.CardSegment.charAt(0)}${li.FightOrder}`;
                        
                        //const decide if we are going to add a li divider
                        const add_divider = fi !== 0 && event_details.FightCard[fi-1].CardSegment !== li.CardSegment;
                        let divider = "";

                        if (add_divider || fi === 0){
                            //format: "2024-07-28T02:00Z"
                            const card_segment_datetime = new Date(li.CardSegmentStartTime)
                            const card_segment_time = `${card_segment_datetime.getHours()}:${card_segment_datetime.getMinutes() < 10 ? '0'+card_segment_datetime.getMinutes() : card_segment_datetime.getMinutes()}`;

                            divider = html`<li class="event-fight-list-divider">${li.CardSegment} - ${card_segment_time}</li>`;
                        }

                        return html`
                            ${divider}
                            <li 
                                data-fight-id="${li.FightId}" 
                                onclick="select_fight()" 
                                class="d--f fd--r ai--c jc--c fight"
                            >
                                <div class="fight-tracker ps--a">${fight_order}</div>${li.Fighters.map( (fighter, i) => {
                                    const src = `images/fighter/headshot/${fighter.UFCLink.split("athlete/")[1]}.png`.toLowerCase();
                                    const flag_src = `images/flags/${fighter.Born.TriCode?.substring(0,2).toLowerCase()}.png`;
                                    return html`
                                        <div class="fighter d--f jc--sb ai--c ${i===0?"fd--rr":"fd--r"}">
                                            <div class="fight-list-img-containor">
                                                <img class="fight-list-img ${i===0?'left':'right'}" src="${src}" alt="xx">
                                            </div>
                                            <div class="d--f fd--c ai--c">
                                                <p class="fight-list-name">${fighter.Name.LastName}</p>
                                                <p style="font-size: 1.2rem;margin-top: .25rem;">${fighter.Record.Wins}-${fighter.Record.Losses}-${fighter.Record.Draws}</p>
                                            </div>
                                            <img class="fight-list-flag as--fs" src="${flag_src}" >
                                        </div>`;})}
                            </li>`
                    })}
                    <li class="fight-list-end">
                        <button onclick="return_to_top()">Return to top</button>
                    </li>
                </ul>`;
        },
        listeners :{
            sort_list: function(event){
                
            },
            toggle_drawer: function(event){
                event.target.closest(".event-list-manager").classList.toggle("active")
            },
            return_to_top: function(event){
                console.log(event);
                event.target.closest("ul").scroll(0,0);
            },
            select_fight: function(event){
                console.log(event)
                const li = event.target.closest("li");
		li.classList.add("tapped")

                const fight_id = li.dataset.fightId;
                console.log(fight_id);

     	        setTimeout(() => {
     	            li.classList.remove('tapped');
                    app.mods.view.change("ufc_fight", {fight_id});
	        }, 200); // Duration of the effect
            }
        },
        setters: {
            fetch: async function(){
                this.is_loading = true;
                const response = await arc.get(UFC_EVENT, READ_ONE, {fmid: this.data.id});
                console.log(response,"response")
                this.is_loading = false;
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
            //position: 'top',
            display: false
        },
        title: {
            display: true, // Enable the title
            text: 'Betting Odds Time Series', // Title text
            position: 'top', // Position the title at the top (default)
        },
        plugins: {
            tooltips: {
                //enabled: false
            },
            title: {
                display: true, // Enable the title
                text: 'UFC Betting Odds Over Time', // Title text
                position: 'top', // Position the title at the top (default)
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
                // {name: "Sherdog", odds: "2.3 : .5"},
                // {name: "UFC", odds: "2.3 : .5"},
                // {name: "Bet365", odds: "2.3 : .5"},
                // {name: "Vegas", odds: "2.3 : .5"},
                // {name: "Vegas", odds: "2.3 : .5"}
                {
                    name: "Sherdog",
                    odds: {
                        fighter_1: 2.3,
                        fighter_2: 1.5
                    },
                },
                {
                    name: "UFC",
                    odds: {
                        fighter_1: 2.3,
                        fighter_2: 1.5
                    }
                },
                {
                    name: "Bet365",
                    odds: {
                        fighter_1: 2.3,
                        fighter_2: 1.5
                    }
                },
                {
                    name: "Vegas",
                    odds: {
                        fighter_1: 2.3,
                        fighter_2: 1.5
                    }
                },
                {
                    name: "Vegas",
                    odds: {
                        fighter_1: 2.3,
                        fighter_2: 1.5
                    }
                }
            ],
            chart : null,
        },
        template: function(props) {

            if (this.is_loading){
                return loader();
            }

            const fighters = props.fight.Fighters
            const fighter_1 = fighters[0];
            const fighter_2 = fighters[1];

            const fighter_1_heroshot_src = `images/fighter/heroshot/${fighter_1.UFCLink.split("athlete/")[1]}.png`.toLowerCase();
            const fighter_2_heroshot_src = `images/fighter/heroshot/${fighter_2.UFCLink.split("athlete/")[1]}.png`.toLowerCase();

            //fighter flags src
            const fighter_1_flag_src = `images/flags/${fighter_1.Born.TriCode.substring(0,2).toLowerCase()}.png`;
            const fighter_2_flag_src = `images/flags/${fighter_2.Born.TriCode.substring(0,2).toLowerCase()}.png`;

            return html`
                <div class="fight-odds d--f ai--c jc--sb">
                    ${props.odds.map( odd => {

                        //add a red color to the underdog, green to the favorite
                        const fav = odd.odds.fighter_1 > odd.odds.fighter_2 ? "fighter_1" : "fighter_2";
                        const und = fav === "fighter_1" ? "fighter_2" : "fighter_1";

                        let fav_color = fav === "fighter_1" ? "c--green" : "c--red";
                        let und_color = und === "fighter_1" ? "c--green" : "c--red";

                        //if the odds are the same, we will just mark both gra
                        if (odd.odds.fighter_1 === odd.odds.fighter_2){
                            fav_color = "c--gray";
                            und_color = "c--gray";
                        }

                        return html`
                            <div onclick="toggle_chart()" class="fight-odds-item d--f fd--c ai--c jc--c">
                                <div>
                                    <p class="ta--c">${odd.name}</p>
                                    <div class="d--f jc--c g--xxxs ai--c">
                                        <p class="${fav_color}">${odd.odds.fighter_1}</p>
                                        <p>:</p>
                                        <p class="${und_color}">${odd.odds.fighter_2}</p>
                                    </div>
                                </div>
                            </div>`;
                    })}
                </div>
                <div class="fight-header ai--c d--f jc--sb">
                    <div data-fighter="0" onclick="toggle_odds()" class="fighter-containor active d--f ai--c g--xss jc--c">
                        <div class="carocel">
                            <img class="fighter-flag front" src="${fighter_1_flag_src}" alt="xx">
                            ${get_svg("wreath", 'class="carocel-image back"')}
                        </div>
                        <p class="fighter-name d--f fd--c ai--fs jc--c g--xs fg--1">
                            <span>${fighter_1.Name.FirstName}</span>
                            <span>${fighter_1.Name.LastName}</span>
                        </p>
                    </div>
                    <div data-fighter="1" onclick="toggle_odds()" class="fighter-containor active d--f ai--c g--xss jc--c">
                        <p class="fighter-name d--f fd--c ai--fe jc--c g--xs fg--1">
                            <span>${fighter_2.Name.FirstName}</span>
                            <span>${fighter_2.Name.LastName}</span>
                        </p>
                        <div class="carocel">
                            <img class="fighter-flag front" src="${fighter_2_flag_src}" alt="xx">
                            ${get_svg("wreath", 'class="carocel-image back"')}
                        </div>
                    </div>
                </div>
                <div class="fighter-details d--f jc--sa ai--fs">
                    <div class="fight-odds-chart-containor">
                        <canvas id="fight-odds-chart"></canvas>
                    </div>
                    <div class="d--f jc--sb ai--fs" style="width: 100%;">
                        <div onclick="select_fighter()" data-fight-id="${fighter_1.FighterId}" class="fighter-heroshot-containor">
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
                        <div  onclick="select_fighter()" data-fight-id="${fighter_2.FighterId}" class="fighter-heroshot-containor">
                            <img class="fighter-heroshot" src="${fighter_2_heroshot_src}" alt="xx">
                        </div>
                    </div>
                </div>
                <div class="fight-analysis">
                    <ul class="fight-analysis-list">
                        <li onclick="open_module()">
                            <h3>Crowd Source Prediction</h3>
                            <div class="module-containor">
                                <div class="module">
                                    <h3>Crowd Source Prediction</h3>
                                    <p class="description">This chart shows the daily time series of the crowd source prediction for this fight</p>
                                    <div class="chart-containor">Chart</div>
                                    <div class="vote-inputs">
                                        <input onchange="handle_vote()" type="checkbox" id="vote-1" name="vote-1" value="1">
                                        <label for="vote-1">Fighter 1</label>
                                        <input onchange="handle_vote()" type="checkbox" id="vote-2" name="vote-2" value="2">
                                        <label for="vote-2">Fighter 2</label>
                                    </div>
                                </div>
                            </div>
                            <div class="action-button">
                                ${get_svg('plus', 'class="svg-plus"')}
                            </div>
                        </li>
                        <li onclick="open_module()">
                            <h3>Guru Board</h3>
                            <div class="module-containor">
                                <div class="module">
                                    <h3>Guru Board</h3>
                                    <p>This module is for the top (10%) ranked gurus to give their analysis on the fight</p>
                                    <div class="forum-post">
                                        <textarea placeholder="Post your analysis"></textarea>
                                        <button>Post</button>
                                    </div>
                                </div>
                            </div>
                            <div class="action-button">
                                ${get_svg('plus', 'class="svg-plus"')}
                            </div>
                        </li>
                        <li onclick="open_module()">
                            <h3>My Prediction</h3>
                            <div class="module-containor">
                                <div class="module">
                                    <h3>FV-AI Analysis</h3>
                                    <p class="fv-ai-analysis">
                                        We predict that fighter 1 will win this fight with a 70% probability. 
                                        Also we predict that the fight will end in the 3rd round by submission.
                                        And the fight will be a close one.
                                    </p>
                                </div>
                            </div>
                            <div class="action-button">
                                ${get_svg('plus', 'class="svg-plus"')}
                            </div>
                        </li>
                    </ul>
                    <footer>Footer</footer>
                </div>`;
        },
        listeners :{
            toggle_odds: function(event){
                //window['fight-odds-chart'].data.datasets[0].hidden = true;

                let div;

                if (event.target.classList.contains("fighter-containor")){
                    div = event.target;
                } else {
                    div = event.target.closest(".fighter-containor");
                }

                div.classList.toggle("active");

                const fighter = parseInt(div.dataset.fighter);

                console.log(fighter, div);

                const chart = window['fight-odds-chart'];

                const dataset = chart.data.datasets[fighter];
                dataset.hidden = !dataset.hidden;
                chart.update();

            },
            toggle_chart: function(event){

                //check if any of the fight odds items are active
                const active = Q(".fight-odds-item.active", true);

                if (active.length === 0){
                    Q(".fight-odds-chart-containor").classList.toggle("active");
                }

                const foi = event.target.closest(".fight-odds-item")
                foi.classList.toggle("active");

                this.elem.querySelectorAll(".fighter-containor").forEach( x => x.classList.remove("active"));

            },
            open_module: function(event){
                console.log(event)
                const li = event.target.closest("li");
                li.querySelector(".module-containor").classList.toggle("active");
                li.classList.toggle("active");
                Q("#modal-overlay").classList.toggle("active");
            },
            select_fighter: function(event){
                const div = event.target.closest("div");
                const fmid = div.dataset.fightId;
                console.log(fmid);
                app.mods.view.change("ufc_fighter", { fmid });
            }
        },
        setters: {
            fetch: async function(){
                this.is_loading = true;
                const response = await arc.get(UFC_FIGHT, READ_ONE, {fight_fmid: this.data.fight_id});
                this.is_loading = false;
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

function view_ufc_fighter({ fmid }){
    const ufc_fighter = new Component('main', {
        data: {
            header: "fighter",
            fmid,
            fighter: null,
        },
        template: function(props) {

            if (this.is_loading || !props?.fighter){
                return loader();
            }

            //fighter contents {"Age": 36, "DOB": "1988-07-09", "Born": {"City": "Chicago", "State": "Illinois", "Country": "USA", "TriCode": "USA"}, "Name": {"LastName": "Muhammad", "NickName": "Remember the Name", "FirstName": "Belal"}, "MMAId": 129355, "Reach": 72.0, "Corner": "Blue", "Height": 71.0, "Record": {"Wins": 23, "Draws": 0, "Losses": 3, "NoContests": 1}, "Stance": "Orthodox", "Weight": 170.0, "Outcome": {"Outcome": null, "OutcomeId": null}, "UFCLink": "http://www.ufc.com/athlete/Belal-Muhammad", "WeighIn": null, "FighterId": 2778, "KOOfTheNight": false, "FightingOutOf": {"City": "Chicago", "State": "Illinois", "Country": "USA", "TriCode": "USA"}, "WeightClasses": [{"Description": "Welterweight", "Abbreviation": "WW", "WeightClassId": 4, "WeightClassOrder": 1}], "SubmissionOfTheNight": false, "PerformanceOfTheNight": false}
            //cont {"stats": {"Wins by Knockout": "5", "Wins by Submission": "1"}, "record": "23-3-0 (W-L-D)", "division": "Welterweight Division", "nickname": "\"Remember The Name\"", "fighter_name": "Belal Muhammad", "head_img_url": "https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-05/MUHAMMAD_BELAL_05-06.png?itok=kXjdOJ-D"}
            const fighter = props.fighter
/*
                        <div class="fighter-img-containor">
                            <img class="fighter-img" src="images/fighter/heroshot/${fighter.UFCLink.split("athlete/")[1].toLowerCase()}.png" alt="xx">
                        </div>
                        <div class="fighter-flag-containor">
                            <img class="fighter-flag" src="images/flags/${fighter.Born.TriCode.substring(0,2).toLowerCase()}.png">
                        </div>
*/            
	    const fighter_flag_src = `images/flags/${fighter.Born.TriCode.substring(0,2).toLowerCase()}.png`
	    const fighter_heroshot_src = `images/fighter/heroshot/${fighter.UFCLink.split("athlete/")[1].toLowerCase()}.png`

            return html`
                <div>
                    <div class="fighter-resource-items d--f fd--r ai--c">
			<div>YT</div>
			<div>SM</div>
			<div>RK</div>
			<div>FF</div>
                        <div>GG</div>
                    </div>
                    <div class="fighter-header ai--c d--f jc--sb">
                        <div  class="fighter-containor active d--f ai--c g--xss jc--c">
                            <img class="fighter-flag front" src="${fighter_flag_src}" alt="xx">
                            <p class="fighter-name d--f fd--c ai--fs jc--c g--xs fg--1">
                                <span>${fighter.Name.FirstName}</span>
                                <span>${fighter.Name.LastName}</span>
                            </p>
                        </div>
                        <div class="fighter-containor active d--f ai--c g--xss jc--c">
                        </div>
                    </div>
                    <div class="fighter-details d--f jc--sb">
			<div class="fighter-heroshot-containor">
			    <img class="fighter-heroshot" src="${fighter_heroshot_src}" alt="xx">
			</div>
                        <div class="fighter-info d--f fd--c ai--fs jc--sb">
                                <p>${fighter.Name.FirstName} ${fighter.Name.LastName}</p>
                                <p>${fighter.Name.NickName}</p>
                                <p>Age: ${fighter.Age}</p>
                                <p>DOB: ${fighter.DOB}</p>
                                <p>City: ${fighter.Born.City}</p>
                                <p>State: ${fighter.Born.State}</p>
                                <p>Country: ${fighter.Born.Country}</p>
                                <p>Record</p>
                                <p>Wins: ${fighter.Record.Wins}</p>
                                <p>Losses: ${fighter.Record.Losses}</p>
                                <p>Draws: ${fighter.Record.Draws}</p>
                                <p>No Contests: ${fighter.Record.NoContests}</p>
                                <p>Physical</p>
                                <p>Height: ${inches_to_feet(fighter.Height)}</p>
                                <p>Weight: ${fighter.Weight}</p>
                                <p>Reach: ${fighter.Reach}</p>
                                <p>Stance: ${fighter.Stance}</p>
                        </div>
                    </div>
                    <div class="fight-analysis">
                        <ul class="fight-analysis-list">
                            <li onclick="open_module()">
                                <h3>-</h3>
                                <div class="module-containor">
                                    <div class="module">
                                        <h3>-</h3>
                                        <p>-</p>
                                        <p>-</p>
                                        <p>-</p>
                                    </div>
                                </div>
                                <div class="action-button">
                                    ${get_svg('plus', 'class="svg-plus"')}
                                </div>
                            </li>
                            <li onclick="open_module()">
                                <h3>Expert Analysis</h3>
                                <div class="module-containor">
                                    <div class="module">
                                        <h3>-</h3>
                                        <p>-</p>
                                        <p>-</p>
                                        <p>-</p>
                                    </div>
                                </div>
                                <div class="action-button">
                                    ${get_svg('plus', 'class="svg-plus"')}
                                </div>
                            </li>
                            <li onclick="open_module()">
                                <h3>My Prediction</h3>
                                <div class="module-containor">
                                    <div class="module">
                                        <h3>-</h3>
                                        <p>-</p>
                                        <p>-</p>
                                        <p>-</p>
                                    </div>
                                </div>
                                <div class="action-button">
                                    ${get_svg('plus', 'class="svg-plus"')}
                                </div>
                            </li>
                        </ul>
                        <footer>Footer</footer>
                    </div>
                </div>`;
        },
        listeners :{
        },
        setters: {
            fetch: async function(){
                this.is_loading = true;
                const response = await arc.get(UFC_FIGHTER, READ_ONE, {fmid: this.data.fmid});
                this.is_loading = false;
                console.log(response);
                const fighter = JSON.parse(response.data.data);
                this.data.fighter = fighter;
                this.render();
            }
        }
    });

    return ufc_fighter.do("fetch"), ufc_fighter;
}
