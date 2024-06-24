var AJS = {
	easeInBack: function ( beginningValue, endValue, durationInFrames, framesElapsed, delayInFrames=0 ) {
		var t = framesElapsed - delayInFrames < 0 ? 0 : framesElapsed;  // time since start (as frames elapsed)
		var b = beginningValue;  // beginning value
		var c = endValue - beginningValue;  //  change in value overall
		var d = durationInFrames;  // duration (in frames) overall	
		var s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function ( beginningValue, endValue, durationInFrames, framesElapsed, delayInFrames=0 ) {
		var t = framesElapsed - delayInFrames < 0 ? 0 : framesElapsed;  // time since start (as frames elapsed)
		var b = beginningValue;  // beginning value
		var c = endValue - beginningValue;  //  change in value overall
		var d = durationInFrames;  // duration (in frames) overall	
		var s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	}
}

///Initiation Variables

let topLine_1;
let middleLine_1;
let bottomLine_1;

var state_1 = "menu";  // can be "menu" or "arrow"
var topLineY_1;
var middleLineY_1;
var bottomLineY_1;
var topLeftY_1;
var topRightY_1;
var bottomLeftY_1;
var bottomRightY_1;
var topLeftX_1;
var topRightX_1;
var bottomLeftX_1;
var bottomRightX_1;

///Animation Variables
var segmentDuration_1 = 11;
var menuDisappearDurationInFrames_1 = segmentDuration_1;
var arrowAppearDurationInFrames_1 = segmentDuration_1;
var arrowDisappearDurationInFrames_1 = segmentDuration_1;
var menuAppearDurationInFrames_1 = segmentDuration_1;
var menuDisappearComplete_1 = false;
var arrowAppearComplete_1 = false;
var arrowDisappearComplete_1 = false;
var menuAppearComplete_1 = false;
var currentFrame_1 = 1;

///Menu Disappear 
function menuDisappearAnimation_1() {
	currentFrame_1++;
	if ( currentFrame_1 <= menuDisappearDurationInFrames_1 ) {
		window.requestAnimationFrame( ()=> { 
			//top line
			topLineY_1 = AJS.easeInBack( 10, 33, menuDisappearDurationInFrames_1, currentFrame_1 );
			topLine_1.setAttribute( "d", "M10,"+topLineY_1+" L50,"+topLineY_1 );
			//bottom line
			bottomLineY_1 = AJS.easeInBack( 36, 23, menuDisappearDurationInFrames_1, currentFrame_1 );
			bottomLine_1.setAttribute( "d", "M10,"+bottomLineY_1+" L50,"+bottomLineY_1 );
			//recursion
			menuDisappearAnimation_1();
		});
		
	} else {
		middleLine_1.style.opacity = "0";
		currentFrame_1 = 1;
		menuDisappearComplete_1 = true;
		openMenuAnimation_1();
	}
}

///Cross Appear
function arrowAppearAnimation_1() {
	currentFrame_1++;
	if ( currentFrame_1 <= arrowAppearDurationInFrames_1 ) {
		window.requestAnimationFrame( ()=> { 
			//top line
			topLeftX_1 = AJS.easeOutBack( 10, 15, arrowAppearDurationInFrames_1, currentFrame_1 );
			topLeftY_1 = AJS.easeOutBack( 23, 8, arrowAppearDurationInFrames_1, currentFrame_1 );
			bottomRightX_1 = AJS.easeOutBack( 50, 45, arrowAppearDurationInFrames_1, currentFrame_1 );
			bottomRightY_1 = AJS.easeOutBack( 23, 38, arrowAppearDurationInFrames_1, currentFrame_1 );
			topLine_1.setAttribute( "d", "M" + topLeftX_1 + "," + topLeftY_1 + " L" + bottomRightX_1 + "," + bottomRightY_1 );
			//bottom line
			bottomLeftX_1 = AJS.easeOutBack( 10, 15, arrowAppearDurationInFrames_1, currentFrame_1 );
			bottomLeftY_1 = AJS.easeOutBack( 23, 38, arrowAppearDurationInFrames_1, currentFrame_1 );
			topRightX_1 = AJS.easeOutBack( 50, 45, arrowAppearDurationInFrames_1, currentFrame_1 );
			topRightY_1 = AJS.easeOutBack( 23, 8, arrowAppearDurationInFrames_1, currentFrame_1 );
			bottomLine_1.setAttribute( "d", "M" + bottomLeftX_1 + "," + bottomLeftY_1 + " L" + topRightX_1 + "," + topRightY_1 );
			//recursion
			arrowAppearAnimation_1();
		});
	} else {
		currentFrame_1 = 1;
		arrowAppearComplete_1 = true;
		openMenuAnimation_1();
	}
}

///Combined Open Menu Animation
function openMenuAnimation_1() {
	if ( !menuDisappearComplete_1 ) { 
		menuDisappearAnimation_1();
	} else if ( !arrowAppearComplete_1) {
		arrowAppearAnimation_1();
	}
}

///Cross Disappear
function arrowDisappearAnimation_1() {
	currentFrame_1++;
	if ( currentFrame_1 <= arrowDisappearDurationInFrames_1 ) {
		window.requestAnimationFrame( ()=> {
			//top line
			topLeftX_1 = AJS.easeInBack( 15, 10, arrowDisappearDurationInFrames_1, currentFrame_1 );
			topLeftY_1 = AJS.easeInBack( 8, 23, arrowDisappearDurationInFrames_1, currentFrame_1 );
			bottomRightX_1 = AJS.easeInBack( 45, 50, arrowDisappearDurationInFrames_1, currentFrame_1 );
			bottomRightY_1 = AJS.easeInBack( 38, 23, arrowDisappearDurationInFrames_1, currentFrame_1 );
			topLine_1.setAttribute( "d", "M" + topLeftX_1 + "," + topLeftY_1 + " L" + bottomRightX_1 + "," + bottomRightY_1 );
			//bottom line
			bottomLeftX_1 = AJS.easeInBack( 15, 10, arrowDisappearDurationInFrames_1, currentFrame_1 );
			bottomLeftY_1 = AJS.easeInBack( 38, 23, arrowDisappearDurationInFrames_1, currentFrame_1 );
			topRightX_1 = AJS.easeInBack( 45, 50, arrowDisappearDurationInFrames_1, currentFrame_1 );
			topRightY_1 = AJS.easeInBack( 8, 23, arrowDisappearDurationInFrames_1, currentFrame_1 );
			bottomLine_1.setAttribute( "d", "M" + bottomLeftX_1 + "," + bottomLeftY_1 + " L" + topRightX_1 + "," + topRightY_1 );
			//recursion
			arrowDisappearAnimation_1();
		});
	} else {
		middleLine_1.style.opacity = "1";
		currentFrame_1 = 1;
		arrowDisappearComplete_1 = true;
		closeMenuAnimation_1();
	}
}

///Menu Appear
function menuAppearAnimation_1() {
	currentFrame_1++;
	if ( currentFrame_1 <= menuAppearDurationInFrames_1 ) {
		window.requestAnimationFrame( ()=> {
			//top line
			topLineY_1 = AJS.easeOutBack( 23, 10, menuDisappearDurationInFrames_1, currentFrame_1 );
			topLine_1.setAttribute( "d", "M10,"+topLineY_1+" L50,"+topLineY_1 );
			//bottom line
			bottomLineY_1 = AJS.easeOutBack( 23, 36, menuDisappearDurationInFrames_1, currentFrame_1 );
			bottomLine_1.setAttribute( "d", "M10,"+bottomLineY_1+" L50,"+bottomLineY_1 );
			//recursion
			menuAppearAnimation_1();
		});
	} else {
		currentFrame_1 = 1;
		menuAppearComplete_1 = true;
		closeMenuAnimation_1();
	}
}

///Close Menu Animation
function closeMenuAnimation_1() {
	if ( !arrowDisappearComplete_1 ) {
		arrowDisappearAnimation_1();
	} else if ( !menuAppearComplete_1 ) {
		menuAppearAnimation_1();
	}
}

function menu_toggle(){
    if ( state_1 === "menu" ) {
        openMenuAnimation_1();
        state_1 = "arrow";
        arrowDisappearComplete_1 = false;
        menuAppearComplete_1 = false;
    } else if ( state_1 === "arrow" ) {
        closeMenuAnimation_1();
        state_1 = "menu";
        menuDisappearComplete_1 = false;
        arrowAppearComplete_1 = false;
    }
}

const Hamburger = (function(){
    
    const DEFAULT_MODE = "menu";
    const DEBOUNCE_TIME = 600;
    
    // on document load
    let _state = {
        is_busy: false,
        is_open: false,
        mode: DEFAULT_MODE
    }

    function _change_state(is_open, mode){
        _state = {
            ..._state,
            is_open,
            mode
        }
        menu_toggle();
    }

    function state(){
        return _state;
    }

    function busy(action){
        if (action === true){
            _state.is_busy = true;
        } else if (action === false) {
            setTimeout(() => { _state.is_busy = false }, DEBOUNCE_TIME)
        }
    }

    function open(choice){
        lock("#app-containor");
        if ( choice === "menu" ){
            _change_state(true, "menu");
            const cl = Q("#menu").classList;
            get_menu();
            cl.contains("active") ? cl.remove("active", "active-home", "active-viewer") : cl.add("active", "active-home");
            Q("#menu-viewer").classList.remove("open");

        } else if ( choice === "search" ){
            _change_state(true, "search");
            Q("#screen").classList.add("active");
            Q("#screen").clientWidth;
            Q("#screen").classList.add("transition");
            Q("#header-search-button").classList.remove('active');
            Q("#header-bottom").classList.add("active");
            hide("#header-logo");
        }
    }

    function close(){
        unlock("#app-containor");
        if (_state['mode'] === "menu"){
            _change_state(false, DEFAULT_MODE);
            const cl = Q("#menu").classList;
            get_menu();
            cl.contains("active") ? cl.remove("active", "active-home", "active-viewer") : cl.add("active", "active-home");
            Q("#menu-viewer").classList.remove("open");
            
        } else if (_state['mode'] === "search"){
            _change_state(false, DEFAULT_MODE);
            Q("#screen").classList.remove("active");
            Q("#header-search-button").classList.add('active');
            Q("#header-bottom").classList.remove("active");
            Q("#search").blur();
            Q("#search").value = "";
            show("#header-logo");
        }
    }

    return {
        busy,
        state,
        open,
        close
    }

})()