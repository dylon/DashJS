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
  nomen      : true  , 
  on         : false , 
  passfail   : false , 
  plusplus   : true  , 
  regexp     : false , 
  safe       : false , 
  sloppy     : false , 
  sub        : false , 
  undef      : false , 
  unparam    : false , 
  vars       : false , 
  white      : true  , 
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

Base       ,
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

Arrays ;

/**
 * Contains utility methods for managing arrays.
 */
Arrays = {
    
    /**
     * Removes an element from an array; intended to be called like:
     *
     *    // `a' is the array from which to remove an element.
     *    // `e' is the element to remove.
     *    Arrays.remove( a, e );
     *
     * This mimics appending the method to the Array prototype, and helps keep
     * the global namespace clean as well as better facilitates calling the
     * method on Array-like objects.  The method can be aliased and called
     * effectively like so:
     *
     *     var r = Arrays.remove;
     *     r( a, e );
     *
     * , which isn't as verbose as the first example.
     *
     * @param self
     * Array from which to remove the element.
     *
     * @param elem
     * Element to remove from the array.
     */
    remove : function ( self, elem ) {
        var i = Arrays.indexOf( self, elem );

        if ( i >= 0 ) {
            self.splice( i, 1 );
        }
    },

    /**
     * Removes an element from a sorted array.  Because the array is sorted, a
     * binary search may be used to locate the element (if it exists) without
     * having to iterate over every element.
     *
     * @param self
     * Array from which to remove an element.
     *
     * @param elem
     * Element to remove from the array.
     *
     * @param compare
     * (Optional) Binary function which compares the element to remove with
     * those in the array.  It should return zero (0) for equivalent elements, a
     * value greater than zero (1) for elements less than the one to remove, and
     * a value less than zero (-1) for elements greater than the element to
     * remove.
     */
    removeSorted : function ( self, elem, compare ) {
        var i = Arrays.binarySearch( self, elem, compare );

        if ( i >= 0 ) {
            self.splice( i, 1 );
        }
    },

    /**
     * Iterates over the elements in an array to determine an index at which one
     * specific element resides.  This method iterates from the first to last
     * element while at the same time iterating from the last to the first in
     * search of the first index at which the element is located; thus, if the
     * element occurs more than once in the array, its index closest to either
     * the beginning or end of the array will be returned.
     *
     * @param self
     * Array to search through.
     *
     * @param elem
     * Element to find in the array.
     *
     * @return
     * An index in the array containing the element or (-1) if it is not found.
     */
    indexOf : function ( self, elem ) {
        var i, j;

        for ( i = 0, j = self.length - 1; i <= j; ++ i, -- j ) {
            if ( self[ i ] === elem ) { return i; }
            if ( self[ j ] === elem ) { return j; }
        }

        return -1;
    },

    /**
     * Iterates over an array in search of a specific element from its first
     * index to its last, and returns the first index at which the element is
     * located.
     *
     * @param self
     * Array through which to search for elem.
     *
     * @param elem
     * Element to find in the array.
     *
     * @return
     * The first index of the array mapped to the element or (-1) if it is not
     * found.
     */
    firstIndexOf : function ( self, elem ) {
        var i, k;

        for ( i = 0, k = self.length; i < k; ++ i ) {
            if ( self[ i ] === elem ) { return i; }
        }

        return -1;
    },

    /**
     * Iterates over an array from its last index to its first in search of a
     * specific element.  Returns the last index mapped to the same element.
     *
     * @param self
     * Array through which to search for the element.
     *
     * @param elem
     * Element to locate in the array.
     *
     * @return
     * The last index of the array mapped to the element or (-1) if it is not
     * found.
     */
    lastIndexOf : function ( self, elem ) {
        var i;

        for ( i = self.length - 1; i >= 0; -- i ) {
            if ( self[ i ] === elem ) { return i; }
        }

        return -1;
    },

    /**
     * Default comparator for JavaScript array elements.  It accepts two
     * parameters and compares the numberic value (*.valueOf()) of the first
     * with that of the second.
     *
     * @param e1
     * First element to compare.
     *
     * @param e2
     * Second element to compare.
     *
     * @return
     * An integer value corresponding to whether e1 is greater than e2 (1), less
     * than e2 (-1), or equivalent to e2 (0).
     */
    comparator : function ( e1, e2 ) {
        return ( e1 > e2 ) ? 1 : ( e1 < e2 ) ? -1 : 0;
    },

    /**
     * Searches over the elements of an array for a specific one using a binary
     * search algorithm.
     *
     * @param self
     * Array to search through.
     *
     * @param elem
     * Element to find in the array.
     *
     * @param compare
     * (Optional) Binary function which compares the element to locate with
     * those in the array.  This should return an integer value corresponding to
     * how the element relates to each.
     *
     * @return
     * The first index of the array mapped to the element or (-1) if it is not
     * found.
     */
    binarySearch : function ( self, elem, compare ) {
        var i, j, k, c;

        if ( !compare ) {
            compare = Arrays.comparator;
        }

        i = 0;
        k = self.length;

        do {
            // Round to the nearest integer ...
            j = Math.floor(( i + k ) / 2.0 + 0.5 );
            c = compare( elem, self[ j ] );

            if ( c > 0 ) {
                i = j + 1; continue;
            }

            if ( c < 0 ) {
                k = j - 1; continue;
            }

            // Otherwise, this is the index.
            return j;
        } while ( i < k );

        return -1;
    },

    /**
     * Inserts an element into an array if it does not yet exist therein.  It is
     * important that the array be sorted because this method uses a binary
     * search algorithm to determine where to insert the element.
     *
     * @param self
     * Array into which to insert the element.
     *
     * @param elem
     * Element to insert in to the array.
     *
     * @param compare
     * (Optional) Binary function which compares the element to insert with
     * those in the array.  It should return a numeric value corresponding to
     * how the elements relate, with (0) being equivalent, (1) being greater
     * than, and (-1) being less than.
     */
    insertIfNotExists : function ( self, elem, compare ) {
        var i, j, k, c;

        if ( !compare ) {
            compare = Arrays.comparator;
        }

        i = 0;
        k = self.length;

        do {
            // Round to the nearest integer ...
            j = Math.floor(( i + k ) / 2.0 + 0.5 );
            c = compare( elem, self[ j ] );

            if ( c > 0 ) {
                i = j + 1; continue;
            }

            if ( c < 0 ) {
                k = j - 1; continue;
            }

            // Otherwise, the element exists so return here.
            return;
        } while ( i < k );
        
        // Compare elements one more time ...
        j = Math.floor(( i + k ) / 2.0 + 0.5 );
        c = compare( elem, self[ j ] );

        if ( c > 0 ) {
            j = j + 1;
        }

        // Insert the element into its new home ...
        self.splice( j, 0, elem );
    }
};

/**
 * Constructor constructor
 */
construct = ( function () {
    var

    //
    // Local Variables
    //

    serial , 

    //
    // Property Functions
    //

    parseProps , 
    checkGet   , 
    checkSet   , 

    //
    // Event Functions
    //

    parseEvents         , 
    checkFire           , 
    checkAddListener    , 
    checkRemoveListener , 
    checkOn             ; 

    /** Maintains a count of the current objects */
    serial = 0;

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
                return model.get( self, prop );
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
                return model.set( self, prop, value );
            };
        }
    };

    /**
     * Parses all of the properties to make sure that they have their associated
     * getters and setters.
     *
     * @param proto
     * Prototype object to analyze, which contains a mapping of property names
     * to modes.  The property modes should be self-explanatory, but in case
     * they need clarification, below are their values and explanations:
     *
     * 1. "r"  --> [Read Only ] There may exist only a getter method.
     * 2. "w"  --> [Write Only] There may exist only a setter method.
     * 3. "rw" --> [Read-Write] Both a getter and setter may exist.
     */
    parseProps = function ( proto ) {
        var p, i, m, g, s;

        g = checkGet;
        s = checkSet;

        p = proto.__META__.props;

        for ( i in p ) {
            if ( p.hasOwnProperty( i )) {
                m = p[ i ]; // Mode of the property

                switch ( m ) {
                    case 'r'  : g( proto, i ); break;
                    case 'w'  : s( proto, i ); break;
                    case 'rw' : g( proto, i ); s( proto, i ); break;
                    default   : throw "Unknown mode: " + m;
                }
            }
        }
    };

    /**
     * Ensures that a corresponding "fireXXX" method exists for the given envet.
     *
     * @param proto
     * Prototype to validate.
     *
     * @param event
     * Name of the event which is fired by the prototype.
     */
    checkFire = function ( proto, event ) {
        var f = "fire" + event;

        if ( !proto[ f ] ) {
            proto[ f ] = function ( self, args ) {
                var L, H, i, n, o;

                L = self.get( "Listeners" );
                H = L[ event ];

                if ( H ) {
                    o = "on" + event;

                    for ( i = 0, n = H.length; i < n; ++ i ) {
                        H[ i ][ o ]( self, args );
                    }
                }
            };
        }
    };

    /**
     * Ensures that an "addXXXListener" method exists for the specified event.
     *
     * @param proto
     * Prototype to validate.
     *
     * @param event
     * Name of the event for which to listen.
     */
    checkAddListener = function ( proto, event ) {
        var a = "add" + event + "Listener";

        if ( !proto[ a ] ) {
            proto[ a ] = function ( self, listener ) {
                var L, H;

                L = self.get( "Listeners" );
                H = L[ event ];

                if ( !H ) {
                    H = L[ event ] = [];
                }

                H.push( listener );
            };
        }
    };

    /**
     * Ensures that there exists a "removeXXXListener" method for the given
     * event.
     *
     * @param proto
     * Prototype to validate.
     *
     * @param event
     * Name of the event to validate.
     */
    checkRemoveListener = function ( proto, event ) {
        var r = "remove" + event + "Listener";

        if ( !proto[ r ] ) {
            proto[ r ] = function ( self, listener ) {
                var L, H, i;

                L = self.get( "Listeners" );
                H = L[ event ];
                
                if ( !H ) {
                    return;
                }

                i = Arrays.indexOf( H, listener );

                if ( i < 0 ) {
                    return;
                }

                H.splice( i, 1 );
            };
        }
    };

    /**
     * Parses all of the events of a particular prototype to ensure that all of
     * their necessary members (methods, ...) exist.
     *
     * @param proto
     * Prototype to validate.
     */
    parseEvents = function ( proto ) {
        var E, e, i, n, f, a, r;

        f = checkFire;
        a = checkAddListener;
        r = checkRemoveListener;

        E = proto.__META__.events.fired;

        for ( i = 0, n = E.length; i < n; ++ i ) {
            e = E[ i ];

            f( proto, e );
            a( proto, e );
            r( proto, e );
        }
    };

    /**
     * Ensures that all members required for the to handled event exist.
     *
     * @param proto
     * Prototype to verify.
     * 
     * @param event
     * Name of the event to validate.
     */
    checkOn = function ( proto, event ) {
        Arrays.insertIfNotExists( proto.__META__.events.handled, event );
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
    return function construct( proto, Base ) {
        var F, p, i, r;

        /**
         * Simple constructor
         */
        F = function F() {
            if ( !( this instanceof F )) {
                return new F();
            }

            if ( this.__META__.base ) {
                // Recursively invoke the super type constructor
                this.__META__.base.__META__.constructor.call( this );

            } else {
                // Increment the serial number of objects.  This must be in the
                // "else" block because the constructors are recursively called
                // up the inheritance chain and the serial number would be
                // incremented as many times as there are constructors
                // otherwise.  As it stands, this will only be invoked from the
                // "Base" constructor.
                this.__META__.serial = serial = ( serial + 1 );
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
            F.prototype.__META__.base = Base;
        }
        
        p = F.prototype;

        if ( !p.__META__ ) {
            p.__META__ = {};
        }

        if ( proto ) {
            for ( i in proto ) {
                if ( proto.hasOwnProperty( i )) {
                    p[ i ] = proto[ i ];
                    
                    // Check for an "onXXX" event handler
                    if (( r = /^on([A-Z]\w*)$/.exec( i )) !== null ) {
                        checkOn( proto, r[ 1 ] );
                    }
                }
            }

            if ( p.__META__.props ) {
                parseProps( p );
            }

            if ( p.__META__.events.fired ) {
                parseEvents( p );
            }
        }

        // Assign some metadata to the prototype
        p.__META__.prototype   = p;
        p.__META__.constructor = F;

        return F;
    };
}());

/**
 * Contains basic methods which should be inherited by all the objects.
 */
Base = construct({

    __META__ : {
        serial : 0
    },

    /**
     * Overrides Object.prototype.valueOf() to return the serial number of this
     * object for whatever reason it may be useful.  This is mainly for
     * consistency with this.toString().
     *
     * @return
     * this.__META__.serial
     */
    valueOf : function () {
        return Number( this.__META__.serial );
    },

    /**
     * Overrides Object.prototype.toString() so that this object can be used as
     * a key for a mapping.
     *
     * @return
     * this.__META__.serial
     */
    toString : function () {
        return String( this.__META__.serial );
    }
});

/**
 * Maintains the raw data for a Widget.
 */
Model = Base.extend({

    /**
     * [INTERNAL METHOD] Returns the database object for a given Widget.
     *
     * @param self
     * Widget for which to retrieve a database.
     *
     * @return
     * The database object corresponding to the Widget.
     */
    _getDB : function ( self ) {
        var db = this[ self ];

        if ( !db ) {
            // The *.toString() method is overridden in the Base prototype, so
            // subscripting "self" is fine.
            db = this[ self ] = {
                Listeners : {}
            };
        }

        return db;
    },

    /**
     * With regard to the Widget, returns the value mapped to by the key.
     *
     * @param self
     * Widget having this model.
     *
     * @param key
     * Key for the mapping.
     *
     * @return
     * Whatever is mapped to by the key having the Widget as its context.
     */
    get : function ( self, key ) {
        return this._getDB( self )[ key ];
    },

    /**
     * With regard to the Widget, maps a given key to its value.
     *
     * @param self
     * Widget having this model.
     *
     * @param key
     * Key for the mapping.
     *
     * @param value
     * Value for the mapping.
     */
    set : function ( self, key, value ) {
        this._getDB( self )[ key ] = value;
    }
});

/**
 * Displays the raw data of a Widget.
 */
View = Base.extend();

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
 *     onMyEvent : function ( widget, args ) {
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
Controller = Base.extend({

    __META__ : {

        /**
         * [METADATA] Returns properties maintained by this Controller.
         *
         * @return
         * A mapping of names to modes of the properties maintaine by this
         * Controller.  The available modes include:
         *
         * 1. "r"  --> [Read Only ] Implies there may be only a getter.
         * 2. "w"  --> [Write Only] Implies there may be only a setter.
         * 3. "rw" --> [Read/Write] Implies both a getter and a setter.
         */
        props : {} , 

        /** [METADATA] Self-explanatory eventing data */
        events : {
            fired   : [] , 
            handled : []
        }
    },

    create : function ( self, model, view, controller ) {
        self._model      = model      ; 
        self._view       = view       ; 
        self._controller = controller ; 
    },

    destroy : function ( self ) {
        return;
    },

    init : function ( self ) {
        return;
    },

    enable : function ( self ) {
        throw "Not yet implemented";
    },

    disable : function ( self ) {
        throw "Not yet implemented";
    },

    show : function ( self ) {
        throw "Not yet implemented";
    },

    hide : function ( self ) {
        throw "Not yet implemented";
    }
});

/**
 * Constructs a new Widget for the dashboard.
 */
Widget = Base.extend({
    
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
Dashboard = Base.extend({
    
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
            c[ 'add' + e + 'Listener' ]( this );
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

            c[ 'remove' + e + 'Listener' ]( widget, this );
            remove( a, c );
        }

        remove( this._widgets, widget );
    }
});

// Globally export the Dash module
window.Dash = {

    __META__ : {
        version : '0.9.0'
    },

    Dashboard   : Dashboard  , 
    Widget      : Widget     , 
    Model       : Model      , 
    View        : View       , 
    Controller  : Controller
};

}( window ));

