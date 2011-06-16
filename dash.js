/*!
 * Copyright (c) 2011 Dylon Edwards <dylon@deltasecho.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*jslint
  adsafe     : false , 
  bitwise    : false , 
  browser    : true  , 
  cap        : false , 
  confusion  : false , 
  'continue' : true  , 
  css        : false , 
  debug      : false , 
  devel      : true  , 
  eqeq       : false , 
  es5        : false , 
  evil       : false , 
  forin      : false , 
  fragment   : true  , 
  indent     : 4     , 
  maxerr     : 50    , 
  maxlen     : 80    , 
  newcap     : false , 
  node       : false , 
  nomen      : false , 
  on         : false , 
  passfail   : false , 
  plusplus   : false , 
  regexp     : false , 
  safe       : false , 
  sloppy     : false , 
  sub        : false , 
  undef      : false , 
  unparam    : false , 
  vars       : false , 
  white      : false , 
  widget     : false , 
  windows    : false , 
*/

/**
 * All of the constructors defined below are intended to be extended.  They are
 * not functional in their current state, but serve only as a guideline for the
 * way in which their specialized sub-types should be designed.
 *
 * The library provides the following (see their implementations for additional
 * details):
 *
 *     (1) Dashboard -> As the name implies, this serves as a dashboard to which
 * widgets may be added.  Dashboard utilizes the "observer pattern" to delegate
 * events between widgets.
 *
 *     (2) Widget -> Utilizing the MVC paradigm (Model View Controller), Widget
 * composes an item which should be added to a Dashboard.
 * 
 *     (3) Model -> Maintains the raw data for a Widget.
 * 
 *     (4) View -> Displays a Widget's raw data.  Events may be fired from here.
 * 
 *     (5) Controller -> Implements the business logic for a Widget.  A Widget
 * communicates with other Widgets via firing and handling events through its
 * Controller.  When an event is fired from this Widget, its owning Dashboard
 * will notify all listening Widgets and will pass to them the arguments
 * supplied for the event, as well as this Widget. 
 */
( function ( window, undef ) {

'use strict';

var
    //
    // Constructor Functions
    //

    Model      , 
    View       , 
    Controller , 
    Widget     ,
    Dashboard  , 

    //
    // Local Functions
    //

    construct , 

    //
    // Utility Objects
    //
    
    Arrays
;

/**
 * Contains utility methods for managing arrays.
 */
Arrays = {
    
    /**
     * Removes an element from an array; intended to be called like:
     *
     *    // `a' is the array from which to remove an element.
     *    // `e' is the element to remove.
     *    Arrays.remove.call( a, e );
     *
     * This mimics appending the method to the Array prototype, and helps keep
     * the global namespace clean as well as better facilitates calling the
     * method on Array-like objects.  The method can be aliased and called
     * effectively like so:
     *
     *     var r = Arrays.remove;
     *     r.call( a, e );
     *
     * , which isn't as verbose as the first example.
     */
    remove : function ( e ) {
        var i, k;

        for ( i = 0, k = this.length; i < k; ++ i ) {
            if ( this[ i ] === e ) {
                this.splice( i, 1 );
                return;
            }
        }
    }
};

/**
 * Constructs a new constructor function.
 *
 * @param proto
 * (Optional) object consisting of properties to assign the constructors
 * prototype.
 *
 * @param Base
 * (Optional) Specifies the Base constructor for the one returned.
 *
 * @return 
 * A new constructor function.
 */
construct = ( function () {
    var parseProps, checkGet, checkSet;

    /**
     * Checks that the corresponding "get" method exists.
     *
     * @param proto
     * Prototype to analyze.
     *
     * @param prop
     * Name of the property.
     */
    checkGet = function ( proto, prop ) {
        var getter = 'get' + prop;

        if ( !proto[ getter ] ) { // It may be inherited
            proto[ getter ] = function ( self, model ) {
                return model[ prop ];
            };
        }
    };

    /**
     * Checks that the corresponding "set" method exists.
     *
     * @param proto
     * Prototype to analyze.
     *
     * @param prop
     * Name of the property.
     */
    checkSet = function ( proto, prop ) {
        var setter = 'set' + prop;

        if ( !proto[ setter ] ) { // It may be inherited
            proto[ setter ] = function ( self, model, value ) {
                model[ prop ] = value;
            };
        }
    };

    /**
     * Parses all of the properties to make sure that they have their associated
     * getters and setters.
     *
     * @param p
     * Prototype object to analyze, which contains a mapping of property names
     * to modes.  The property modes should be self-explanatory, but in case
     * they need clarification, below are their values and explanations:
     *
     * 1. "r"  --> [Read Only ] There may exist only a getter method.
     * 2. "w"  --> [Write Only] There may exist only a setter method.
     * 3. "rw" --> [Read-Write] Both a getter and setter may exist.
     */
    parseProps = function ( p ) {
        var i, m, g, s;

        g = checkGet;
        s = checkSet;

        for ( i in p ) {
            if ( p.hasOwnProperty( i )) {
                m = p[ i ]; // Mode of the property

                switch ( m ) {
                    case 'r'  : g( p, i ); break;
                    case 'w'  : s( p, i ); break;
                    case 'rw' : g( p, i ); s( p, i ); break;
                }
            }
        }
    };

    return function construct( proto, Base ) {
        var F, p, i;

        /**
         * Simple constructor
         */
        F = function F() {
            if ( !( this instanceof F )) {
                return new F();
            }

            return this;
        };

        /**
         * Curries a new constructor using an instance of F as its prototype.
         */
        F.extend = function ( proto ) {
            return construct( proto, F );
        };

        if ( Base ) {
            F.prototype = new Base();
            F.prototype.__BASE__ = Base;
        }
        
        p = F.prototype;

        if ( proto ) {
            for ( i in proto ) {
                if ( proto.hasOwnProperty( i )) {
                    p[ i ] = proto[ i ];
                }
            }

            if ( p.__PROPERTIES__ ) {
                parseProps( p );
            }
        }

        // Assign some metadata to the prototype
        p.__PROTOTYPE__   = p;
        p.__CONSTRUCTOR__ = F;

        return F;
    };
}());

/**
 * Maintains the raw data for a Widget.
 */
Model = construct({
    EventsFired   : [] , 
    EventsHandled : [] ,
    Listeners     : {}
});

/**
 * Displays the raw data of a Widget.
 */
View = construct();

/**
 * Contains the business logic of a Widget.  It is essential that this
 * Controller report not only the events which it fires, but also the events for
 * which it handles.  To specify which events it fires, the name of each event
 * should be pushed onto the _events list.  Likewise, to specify which events
 * are handled, the name of each event should be pushed onto the _handles list.
 *
 * To actually handle an event named, "MyEvent", first record that the event is
 * handled as described above and then implement a method following the naming
 * convention "on" + "event name", like so:
 *
 *     onMyEvent : function ( args, controller ) {
 *         // handle event
 *     }
 *
 * , where `args' are the arguments passed with the event (this may be an array,
 * object, or even null depending on the event) and `controller' is the
 * Controller which fired the event.  It is important to implement this method
 * once it is reported as being handled because the Dashboard will expect it to
 * exist and will not check for its existence, but will instead throw an
 * exception if it is undefined.
 */
Controller = construct({

    __PROPERTIES__ : {

        /** Names of the events fired by this Controller */
        EventsFired : 'r',

        /** Names of the events which are handled by this Controller */
        EventsHandled : 'r',

        /** Mapping of event names to handlers listening for them */
        Listeners : 'r'
    },

    /**
     * Fires an event by invoking every listener for it in this Controller.
     *
     * @param self
     * Widget managed by this Controller.
     *
     * @param props
     * Mapping consisting of the name of the event as well as its arguments.
     */
    fire : function ( self, props ) {
        var L, i, k, e, name, args;

        name = props.name;
        args = props.args;

        L = self.get( 'Listeners' )[ name ];

        if ( !L ) {
            return;
        }

        e = 'on' + name;
        for ( i = 0, k = L.length; i < k; ++ i ) {
            L[ i ][ e ]( args, self );
        }
    },

    /**
     * Adds a listener for a specific event to this Controller.
     *
     * @param self
     * Widget managed by this Controller.
     *
     * @param args
     * Array consisting of the name of two elements: the name of the event and
     * the method listening for it.
     */
    addListener : function ( self, args ) {
        var P, L, name, listener;

        name     = args[ 0 ];
        listener = args[ 1 ];
        
        P = self.get( 'Listeners' );
        L = P[ name ];

        if ( !L ) {
            L = P[ name ] = [];
        }

        L.push( listener );
    },

    /**
     * Returns whether the listener is listening for the specified event in this
     * Controller.
     *
     * @param self
     * Widget managed by this Controller.
     *
     * @param args
     * Array consisting of the name of two elements: the name of the event and
     * the method listening for it.
     *
     * @return
     * Whether the listener is listening for the event in this Controller.
     */
    containsListener : function ( self, args ) {
        var L, i, j, name, listener;

        name     = args[ 0 ];
        listener = args[ 1 ];
        
        L = self.get( "Listeners" )[ name ];

        if ( L ) {
            for ( i = 0, j = L.length; i < j; ++ i ) {
                if ( L[ i ] === listener ) {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Removes a listener method from this Controller.  NOTE: This method only
     * removes the first instance of the listener found, not all of them; the
     * listener needs to be removed from this Controller the same number of
     * times it was added to it.
     *
     * @param self
     * Widget managed by this Controller.
     *
     * @param args
     * Array consisting of the name of two elements: the name of the event and
     * the method listening for it.
     */
    removeListener : function ( self, args ) {
        var P, L, i, j, name, listener;

        name     = args[ 0 ];
        listener = args[ 1 ];
        
        P = self.get( "Listeners" );
        L = P[ name ];

        if ( !L ) {
            return;
        }

        for ( i = 0, j = L.length; i < j; ++ i ) {
            if ( L[ i ] === listener ) {
                L.splice( i, 1 );
                break;
            }
        }

        if ( L.length === 0 ) {
            // Remove the reference to this event from the listeners if there is
            // nothing listening for it.
            delete P[ name ];
        }
    }
});

/**
 * Constructs a new Widget for the dashboard.
 */
Widget = construct({
    
    _model      : null ,
    _view       : null ,
    _controller : null ,

    /**
     * Invokes the method specified on this widget's controller, and passes it
     * the given arguments.  Implementations may choose to override this method.
     *
     * @param method
     * Name of the method to invoke.
     *
     * @param args
     * Arguments to pass the method.
     *
     * @return
     * Whatever the corresponding method in the controller returns.
     */
    call : function ( method, args ) {
        return this._controller[ method ]( this, args );
    },

    get : function ( property ) {
        var getter = 'get' + property;
        return this._controller[ getter ]( this, this._model );
    },

    set : function ( property, value ) {
        var setter = 'set' + property;
        return this._controller[ setter ]( this, this._model, value );
    }
});

/**
 * Using the "observer pattern", Dashboards delegate events across their managed
 * Widgets.
 */
Dashboard = construct({
    
    _widgets   : [] , // Integers --> Widgets
    _events    : {} , // Strings  --> Integers --> Controllers
    _listeners : {} , // Strings  --> Integers --> Controllers

    /**
     * [INTERNAL METHOD] Dynamically adds a new delegate to this dashboard.
     *
     * @param a
     * Array containing the event listeners.
     *
     * @param n
     * Name of the delegate.
     */
    _addHandler : function ( a, n ) {
        this[ n ] = function ( args, controller ) {
            var A, N, i, k;

            A = a; N = n;

            for ( i = 0, k = A.length; i < k; ++ i ) {
                A[ i ][ N ]( args, controller );
            }
        };
    },
    
    /**
     * [INTERNAL METHOD] Assists in registering events with this dashboard.  If
     * they are not yet registered, it dynamically assigns this dashboard a new
     * delegation method.
     *
     * @param E
     * Events to register.
     *
     * @param L
     * Event Listeners which are already registered.
     *
     * @param f
     * Callback function to call once each event is registered.
     */
    _registerEvents : function ( E, L, f ) {
        var i, k, e, a, n;

        for ( i = 0, k = E.length; i < k; ++ i ) {
            e = E[ i ];
            a = L[ e ];

            if ( !a ) {
                // Assign to `a' a new array
                a = L[ e ] = [];

                // Determine the name of the event handler
                n = 'on' + e;

                // Register a new method for event delegation
                this._addHandler( a, n );
            }

            f.call( this, e, a );
        }
    },

    /**
     * Adds a widget to this dashboard.  Once done, this dashboard will delegate
     * events to and from the widget.
     *
     * @param widget
     * The widget to add to this dashboard.
     */
    addWidget : function ( widget ) {
        var E, H, L, c;

        c = widget.controller();
        E = c.events();
        H = c.handles();

        L = this._listeners;

        this._registerEvents( E, L, function ( e, a ) {
            c.addListener( e, this );
        });

        this._registerEvents( H, L, function ( e, a ) {
            a.push( c );
        });

        this._widgets.push( widget );
    },

    /**
     * Removes a widget from this dashboard.  Once done, this dashboard will no
     * longer send events to the widget, or delegate events fired by it.
     *
     * @param widget
     * The widget to remove.
     */
    removeWiget : function ( widget ) {
        var remove, E, H, EH, L, c, i, j, k, n, e, a;

        remove = Arrays.remove;

        c  = widget.controller();
        H  = c.handles();

        L = this._listeners;

        for ( i = 0, k = H.length; i < k; ++ i ) {
            e = H[ i ];
            a = L[ e ];

            c.removeListener( e, this );
            remove.call( a, c );
        }

        remove.call( this._widgets, widget );
    }
});

// Globally export the namespace
window.Dash = {
    __VERSION__ : '0.9.0'    , 
    Dashboard   : Dashboard  , 
    Widget      : Widget     , 
    Model       : Model      , 
    View        : View       , 
    Controller  : Controller
};

}( window ));

