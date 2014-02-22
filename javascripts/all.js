/*!
 * Modernizr v2.7.1
 * www.modernizr.com
 *
 * Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
 * Available under the BSD and MIT licenses: www.modernizr.com/license/
 */

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton
 * Contributors   Ryan Seddon, Ben Alman
 */


window.Modernizr = (function( window, document, undefined ) {

    var version = '2.7.1',

    Modernizr = {},

    /*>>cssclasses*/
    // option for enabling the HTML classes to be added
    enableClasses = true,
    /*>>cssclasses*/

    docElement = document.documentElement,

    /**
     * Create our "modernizr" element that we do most feature tests on.
     */
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    /**
     * Create the input element for various Web Forms feature tests.
     */
    inputElem /*>>inputelem*/ = document.createElement('input') /*>>inputelem*/ ,

    /*>>smile*/
    smile = ':)',
    /*>>smile*/

    toString = {}.toString,

    // TODO :: make the prefixes more granular
    /*>>prefixes*/
    // List of property values to set for css tests. See ticket #21
    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
    /*>>prefixes*/

    /*>>domprefixes*/
    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius

    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft uses a lowercase `ms` instead of the correct `Ms` in IE8+
    //   erik.eae.net/archives/2008/03/10/21.48.10/

    // More here: github.com/Modernizr/Modernizr/issues/issue/21
    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),
    /*>>domprefixes*/

    /*>>ns*/
    ns = {'svg': 'http://www.w3.org/2000/svg'},
    /*>>ns*/

    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, // used in testing loop


    /*>>teststyles*/
    // Inject element with style element and some CSS rules
    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
          // After page load injecting a fake body doesn't work so check if body exists
          body = document.body,
          // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
          fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
          // In order not to give false positives we create a node for each test
          // This also allows the method to scale for unspecified uses
          while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

      // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
      // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
      // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
      // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
      // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
      style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
      // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
      // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
          //avoid crashing IE8, if background image is used
          fakeBody.style.background = '';
          //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
          fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
      // If this is done after page load we don't want to remove the body so check if body exists
      if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },
    /*>>teststyles*/

    /*>>mq*/
    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
    testMediaQuery = function( mq ) {

      var matchMedia = window.matchMedia || window.msMatchMedia;
      if ( matchMedia ) {
        return matchMedia(mq).matches;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },
     /*>>mq*/


    /*>>hasevent*/
    //
    // isEventSupported determines if a given element supports the given event
    // kangax.github.com/iseventsupported/
    //
    // The following results are known incorrects:
    //   Modernizr.hasEvent("webkitTransitionEnd", elem) // false negative
    //   Modernizr.hasEvent("textInput") // in Webkit. github.com/Modernizr/Modernizr/issues/333
    //   ...
    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
        var isSupported = eventName in element;

        if ( !isSupported ) {
          // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
          if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

            // If property was created, "remove it" (by setting value to `undefined`)
            if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),
    /*>>hasevent*/

    // TODO :: Add flag for hasownprop ? didn't last time

    // hasOwnProperty shim by kangax needed for Safari 2.0 support
    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }

    // Adapted from ES5-shim https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
    // es5.github.com/#x15.3.4.5

    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    /**
     * setCss applies given styles to the Modernizr DOM node.
     */
    function setCss( str ) {
        mStyle.cssText = str;
    }

    /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    /**
     * is returns a boolean for if typeof obj is exactly type.
     */
    function is( obj, type ) {
        return typeof obj === type;
    }

    /**
     * contains returns a boolean for if substr is found within str.
     */
    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    /*>>testprop*/

    // testProps is a generic CSS / DOM property test.

    // In testing support for a given CSS property, it's legit to test:
    //    `elem.style[styleName] !== undefined`
    // If the property is supported it will return an empty string,
    // if unsupported it will return undefined.

    // We'll take advantage of this quick test and skip setting a style
    // on our modernizr element, but instead just testing undefined vs
    // empty string.

    // Because the testing of the CSS property names (with "-", as
    // opposed to the camelCase DOM properties) is non-portable and
    // non-standard but works in WebKit and IE (but not Gecko or Opera),
    // we explicitly reject properties with dashes so that authors
    // developing in WebKit or IE first don't end up with
    // browser-specific content by accident.

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }
    /*>>testprop*/

    // TODO :: add testDOMProps
    /**
     * testDOMProps is a generic DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     */
    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                // return the property name as a string
                if (elem === false) return props[i];

                // let's bind a function
                if (is(item, 'function')){
                  // default to autobind unless override
                  return item.bind(elem || obj);
                }

                // return the unbound function or obj or value
                return item;
            }
        }
        return false;
    }

    /*>>testallprops*/
    /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        // did they call .prefixed('boxSizing') or are we just testing a prop?
        if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

        // otherwise, they called .prefixed('requestAnimationFrame', window[, elem])
        } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }
    /*>>testallprops*/


    /**
     * Tests
     * -----
     */

    // The *new* flexbox
    // dev.w3.org/csswg/css3-flexbox

    tests['flexbox'] = function() {
      return testPropsAll('flexWrap');
    };

    // The *old* flexbox
    // www.w3.org/TR/2009/WD-css3-flexbox-20090723/

    tests['flexboxlegacy'] = function() {
        return testPropsAll('boxDirection');
    };

    // On the S60 and BB Storm, getContext exists, but always returns undefined
    // so we actually have to call getContext() to verify
    // github.com/Modernizr/Modernizr/issues/issue/97/

    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };

    // webk.it/70117 is tracking a legit WebGL feature detect proposal

    // We do a soft detect which may false positive in order to avoid
    // an expensive context creation: bugzil.la/732441

    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };

    /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: modernizr.github.com/Modernizr/touch.html
     */

    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          bool = true;
        } else {
          injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
            bool = node.offsetTop === 9;
          });
        }

        return bool;
    };


    // geolocation is often considered a trivial feature detect...
    // Turns out, it's quite tricky to get right:
    //
    // Using !!navigator.geolocation does two things we don't want. It:
    //   1. Leaks memory in IE9: github.com/Modernizr/Modernizr/issues/513
    //   2. Disables page caching in WebKit: webk.it/43956
    //
    // Meanwhile, in Firefox < 8, an about:config setting could expose
    // a false positive that would throw an exception: bugzil.la/688158

    tests['geolocation'] = function() {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function() {
      return !!window.postMessage;
    };


    // Chrome incognito mode used to throw an exception when using openDatabase
    // It doesn't anymore.
    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    // Vendors had inconsistent prefixing with the experimental Indexed DB:
    // - Webkit's implementation is accessible through webkitIndexedDB
    // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
    // For speed, we don't test the legacy (and beta-only) indexedDB
    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };

    // documentMode logic from YUI to filter out IE8 Compat Mode
    //   which false positives.
    tests['hashchange'] = function() {
      return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    // Per 1.6:
    // This used to be Modernizr.historymanagement but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    // FF3.6 was EOL'ed on 4/24/12, but the ESR version of FF10
    // will be supported until FF19 (2/12/13), at which time, ESR becomes FF17.
    // FF10 still uses prefixes, so check for it until then.
    // for more ESR info, see: mozilla.org/en-US/firefox/organizations/faq/
    tests['websockets'] = function() {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    // css-tricks.com/rgba-browser-support/
    tests['rgba'] = function() {
        // Set an rgba() color and check the returned value

        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
        // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
        //   except IE9 who retains it as hsla

        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
        // Setting multiple images AND a color on the background shorthand property
        //  and then querying the style.background property value for the number of
        //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!

        setCss('background:url(https://),url(https://),red url(https://)');

        // If the UA supports multiple backgrounds, there should be three occurrences
        //   of the string "url(" in the return value for elemStyle.background

        return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };



    // this will false positive in Opera Mini
    //   github.com/Modernizr/Modernizr/issues/396

    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };


    // Super comprehensive table about all the unique implementations of
    // border-radius: muddledramblings.com/table-of-css3-border-radius-compliance

    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    // WebOS unfortunately false positives on this test.
    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    // FF3.0 will false positive on this test
    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
        // Browsers that actually have CSS Opacity implemented have done so
        //  according to spec, which means their return values are within the
        //  range of [0.0,1.0] - including the leading zero.

        setCssAll('opacity:.55');

        // The non-literal . in this regex is intentional:
        //   German Chrome returns this value as 0,55
        // github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
        return (/^0.55$/).test(mStyle.opacity);
    };


    // Note, Android < 4 will pass this test, but can only animate
    //   a single property at a time
    //   daneden.me/2011/12/putting-up-with-androids-bullshit/
    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        /**
         * For CSS Gradients syntax, please see:
         * webkit.org/blog/175/introducing-css-gradients/
         * developer.mozilla.org/en/CSS/-moz-linear-gradient
         * developer.mozilla.org/en/CSS/-moz-radial-gradient
         * dev.w3.org/csswg/css3-images/#gradients-
         */

        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
             // legacy webkit syntax (FIXME: remove when syntax not in use anymore)
              (str1 + '-webkit- '.split(' ').join(str2 + str1) +
             // standard syntax             // trailing 'background-image:'
              prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testPropsAll('perspective');

        // Webkit's 3D transforms are passed off to the browser's own graphics renderer.
        //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
        //   some conditions. As a result, Webkit typically recognizes the syntax but
        //   will sometimes throw a false positive, thus we must do a more thorough check:
        if ( ret && 'webkitPerspective' in docElement.style ) {

          // Webkit allows this media query to succeed only if the feature is enabled.
          // `@media (transform-3d),(-webkit-transform-3d){ ... }`
          injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
            ret = node.offsetLeft === 9 && node.offsetHeight === 3;
          });
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transition');
    };


    /*>>fontface*/
    // @font-face detection routine by Diego Perini
    // javascript.nwbox.com/CSSSupport/

    // false positives:
    //   WebOS github.com/Modernizr/Modernizr/issues/342
    //   WP7   github.com/Modernizr/Modernizr/issues/538
    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('smodernizr'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };
    /*>>fontface*/

    // CSS generated content detection
    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
          bool = node.offsetHeight >= 3;
        });

        return bool;
    };



    // These tests evaluate support of the video/audio elements, as well as
    // testing what types of content they support.
    //
    // We're using the Boolean constructor here, so that we can extend the value
    // e.g.  Modernizr.video     // true
    //       Modernizr.video.ogg // 'probably'
    //
    // Codec values from : github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
    //                     thx to NielsLeenheer and zcorpan

    // Note: in some older browsers, "no" was a return value instead of empty string.
    //   It was live in FF3.5.0 and 3.5.1, but fixed in 3.5.2
    //   It was also live in Safari 4.0.0 - 4.0.4, but fixed in 4.0.5

    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"')      .replace(/^no$/,'');

                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"') .replace(/^no$/,'');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,'');
            }

        } catch(e) { }

        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                              elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };


    // In FF4, if disabled, window.localStorage should === null.

    // Normally, we could not test that directly and need to do a
    //   `('localStorage' in window) && ` test first because otherwise Firefox will
    //   throw bugzil.la/365772 if cookies are disabled

    // Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
    // will throw the exception:
    //   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
    // Peculiarly, getItem and removeItem calls do not throw.

    // Because we are forced to try/catch this, we'll go aggressive.

    // Just FWIW: IE8 Compat mode supports these features completely:
    //   www.quirksmode.org/dom/html5.html
    // But IE8 doesn't support either with local files

    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    // Thanks to Erik Dahlstrom
    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    // specifically for SVG inline in HTML, not within XHTML
    // test page: paulirish.com/demo/inline-svg
    tests['inlinesvg'] = function() {
      var div = document.createElement('div');
      div.innerHTML = '<svg/>';
      return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    // SVG SMIL animation
    tests['smil'] = function() {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };

    // This test is only for clip paths in SVG proper, not clip paths on HTML content
    // demo: srufaculty.sru.edu/david.dailey/svg/newstuff/clipPath4.svg

    // However read the comments to dig into applying SVG clippaths to HTML content here:
    //   github.com/Modernizr/Modernizr/issues/213#issuecomment-1149491
    tests['svgclippaths'] = function() {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    /*>>webforms*/
    // input features and input types go directly onto the ret object, bypassing the tests loop.
    // Hold this guy to execute in a moment.
    function webforms() {
        /*>>input*/
        // Run through HTML5's new input attributes to see if the UA understands any.
        // We're using f which is the <input> element created early on
        // Mike Taylr has created a comprehensive resource for testing these attributes
        //   when applied to all input types:
        //   miketaylr.com/code/input-type-attr.html
        // spec: www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary

        // Only input placeholder is tested while textarea's placeholder is not.
        // Currently Safari 4 and Opera 11 have support only for the input placeholder
        // Both tests are available in feature-detects/forms-placeholder.js
        Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
              // safari false positive's on datalist: webk.it/74252
              // see also github.com/Modernizr/Modernizr/issues/146
              attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
        /*>>input*/

        /*>>inputtypes*/
        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an object
        //   containing each input type with its corresponding true/false value

        // Big thanks to @miketaylr for the html5 forms expertise. miketaylr.com/
        Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                // We first check to see if the type we give it sticks..
                // If the type does, we feed it a textual value, which shouldn't be valid.
                // If the value doesn't stick, we know there's input sanitization which infers a custom UI
                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                      // Safari 2-4 allows the smiley as a value, despite making a slider
                      bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                              // Mobile android web browser has false positive, so must
                              // check the height to see if the widget is actually there.
                              (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                      // Spec doesn't define any special parsing or detectable UI
                      //   behaviors so we pass these through as true

                      // Interestingly, opera fails the earlier test, so it doesn't
                      //  even make it here.

                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                      // Real url and email support comes with prebaked validation.
                      bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                      // If the upgraded input compontent rejects the :) text, we got a winner
                      bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        /*>>inputtypes*/
    }
    /*>>webforms*/


    // End of test definitions
    // -----------------------



    // Run through all tests and detect their support in the current UA.
    // todo: hypothetically we could be doing an array of tests and use a basic loop here.
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
            // run the test, throw the return value into the Modernizr,
            //   then based on that boolean, define an appropriate className
            //   and push it into an array of classes we'll join later.
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    /*>>webforms*/
    // input tests need to run.
    Modernizr.input || webforms();
    /*>>webforms*/


    /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
           // we're going to quit if you're trying to overwrite an existing test
           // if we were to allow it, we'd do this:
           //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
           //   docElement.className = docElement.className.replace( re, '' );
           // but, no rly, stuff 'em.
           return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; // allow chaining.
     };


    // Reset modElem.cssText to nothing to reduce memory footprint.
    setCss('');
    modElem = inputElem = null;

    /*>>shiv*/
    /**
     * @preserve HTML5 Shiv prev3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
    ;(function(window, document) {
        /*jshint evil:true */
        /** version */
        var version = '3.7.0';

        /** Preset options */
        var options = window.html5 || {};

        /** Used to skip problem elements */
        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        /** Not all elements can be cloned in IE **/
        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        /** Detect whether the browser supports default html5 styles */
        var supportsHtml5Styles;

        /** Name of the expando, to work with multiple documents or to re-shiv one document */
        var expando = '_html5shiv';

        /** The id for the the documents expando */
        var expanID = 0;

        /** Cached data for each document */
        var expandoData = {};

        /** Detect whether the browser supports unknown elements */
        var supportsUnknownElements;

        (function() {
          try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
            //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
            supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
              // assign a false positive if unable to shiv
              (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
          } catch(e) {
            // assign a false positive if detection fails => unable to shiv
            supportsHtml5Styles = true;
            supportsUnknownElements = true;
          }

        }());

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a style sheet with the given CSS text and adds it to the document.
         * @private
         * @param {Document} ownerDocument The document.
         * @param {String} cssText The CSS text.
         * @returns {StyleSheet} The style element.
         */
        function addStyleSheet(ownerDocument, cssText) {
          var p = ownerDocument.createElement('p'),
          parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

          p.innerHTML = 'x<style>' + cssText + '</style>';
          return parent.insertBefore(p.lastChild, parent.firstChild);
        }

        /**
         * Returns the value of `html5.elements` as an array.
         * @private
         * @returns {Array} An array of shived element node names.
         */
        function getElements() {
          var elements = html5.elements;
          return typeof elements == 'string' ? elements.split(' ') : elements;
        }

        /**
         * Returns the data associated to the given document
         * @private
         * @param {Document} ownerDocument The document.
         * @returns {Object} An object of data.
         */
        function getExpandoData(ownerDocument) {
          var data = expandoData[ownerDocument[expando]];
          if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
          }
          return data;
        }

        /**
         * returns a shived element for the given nodeName and document
         * @memberOf html5
         * @param {String} nodeName name of the element
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived element.
         */
        function createElement(nodeName, ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
          }
          if (!data) {
            data = getExpandoData(ownerDocument);
          }
          var node;

          if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
          } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
          } else {
            node = data.createElem(nodeName);
          }

          // Avoid adding some elements to fragments in IE < 9 because
          // * Attributes like `name` or `type` cannot be set/changed once an element
          //   is inserted into a document/fragment
          // * Link elements with `src` attributes that are inaccessible, as with
          //   a 403 response, will cause the tab/window to crash
          // * Script elements appended to fragments will execute when their `src`
          //   or `text` property is set
          return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
        }

        /**
         * returns a shived DocumentFragment for the given document
         * @memberOf html5
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived DocumentFragment.
         */
        function createDocumentFragment(ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
          }
          data = data || getExpandoData(ownerDocument);
          var clone = data.frag.cloneNode(),
          i = 0,
          elems = getElements(),
          l = elems.length;
          for(;i<l;i++){
            clone.createElement(elems[i]);
          }
          return clone;
        }

        /**
         * Shivs the `createElement` and `createDocumentFragment` methods of the document.
         * @private
         * @param {Document|DocumentFragment} ownerDocument The document.
         * @param {Object} data of the document.
         */
        function shivMethods(ownerDocument, data) {
          if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
          }


          ownerDocument.createElement = function(nodeName) {
            //abort shiv
            if (!html5.shivMethods) {
              return data.createElem(nodeName);
            }
            return createElement(nodeName, ownerDocument, data);
          };

          ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
                                                          'var n=f.cloneNode(),c=n.createElement;' +
                                                          'h.shivMethods&&(' +
                                                          // unroll the `createElement` calls
                                                          getElements().join().replace(/[\w\-]+/g, function(nodeName) {
            data.createElem(nodeName);
            data.frag.createElement(nodeName);
            return 'c("' + nodeName + '")';
          }) +
            ');return n}'
                                                         )(html5, data.frag);
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Shivs the given document.
         * @memberOf html5
         * @param {Document} ownerDocument The document to shiv.
         * @returns {Document} The shived document.
         */
        function shivDocument(ownerDocument) {
          if (!ownerDocument) {
            ownerDocument = document;
          }
          var data = getExpandoData(ownerDocument);

          if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
            data.hasCSS = !!addStyleSheet(ownerDocument,
                                          // corrects block display not defined in IE6/7/8/9
                                          'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                                            // adds styling not present in IE6/7/8/9
                                            'mark{background:#FF0;color:#000}' +
                                            // hides non-rendered elements
                                            'template{display:none}'
                                         );
          }
          if (!supportsUnknownElements) {
            shivMethods(ownerDocument, data);
          }
          return ownerDocument;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * The `html5` object is exposed so that more elements can be shived and
         * existing shiving can be detected on iframes.
         * @type Object
         * @example
         *
         * // options can be changed before the script is included
         * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
         */
        var html5 = {

          /**
           * An array or space separated string of node names of the elements to shiv.
           * @memberOf html5
           * @type Array|String
           */
          'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',

          /**
           * current version of html5shiv
           */
          'version': version,

          /**
           * A flag to indicate that the HTML5 style sheet should be inserted.
           * @memberOf html5
           * @type Boolean
           */
          'shivCSS': (options.shivCSS !== false),

          /**
           * Is equal to true if a browser supports creating unknown/HTML5 elements
           * @memberOf html5
           * @type boolean
           */
          'supportsUnknownElements': supportsUnknownElements,

          /**
           * A flag to indicate that the document's `createElement` and `createDocumentFragment`
           * methods should be overwritten.
           * @memberOf html5
           * @type Boolean
           */
          'shivMethods': (options.shivMethods !== false),

          /**
           * A string to describe the type of `html5` object ("default" or "default print").
           * @memberOf html5
           * @type String
           */
          'type': 'default',

          // shivs the document according to the specified `html5` object options
          'shivDocument': shivDocument,

          //creates a shived element
          createElement: createElement,

          //creates a shived documentFragment
          createDocumentFragment: createDocumentFragment
        };

        /*--------------------------------------------------------------------------*/

        // expose html5
        window.html5 = html5;

        // shiv the document
        shivDocument(document);

    }(this, document));
    /*>>shiv*/

    // Assign private properties to the return object with prefix
    Modernizr._version      = version;

    // expose these for the plugin API. Look in the source for how to join() them against your input
    /*>>prefixes*/
    Modernizr._prefixes     = prefixes;
    /*>>prefixes*/
    /*>>domprefixes*/
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;
    /*>>domprefixes*/

    /*>>mq*/
    // Modernizr.mq tests a given media query, live against the current state of the window
    // A few important notes:
    //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
    //   * A max-width or orientation query will be evaluated against the current state, which may change later.
    //   * You must specify values. Eg. If you are testing support for the min-width media query use:
    //       Modernizr.mq('(min-width:0)')
    // usage:
    // Modernizr.mq('only screen and (max-width:768)')
    Modernizr.mq            = testMediaQuery;
    /*>>mq*/

    /*>>hasevent*/
    // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
    // Modernizr.hasEvent('gesturestart', elem)
    Modernizr.hasEvent      = isEventSupported;
    /*>>hasevent*/

    /*>>testprop*/
    // Modernizr.testProp() investigates whether a given style property is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testProp('pointerEvents')
    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };
    /*>>testprop*/

    /*>>testallprops*/
    // Modernizr.testAllProps() investigates whether a given style property,
    //   or any of its vendor-prefixed variants, is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testAllProps('boxSizing')
    Modernizr.testAllProps  = testPropsAll;
    /*>>testallprops*/


    /*>>teststyles*/
    // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
    // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
    Modernizr.testStyles    = injectElementWithStyles;
    /*>>teststyles*/


    /*>>prefixed*/
    // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
    // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'

    // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
    // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
    //
    //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

    // If you're trying to ascertain which transition end event to bind to, you might do something like...
    //
    //     var transEndEventNames = {
    //       'WebkitTransition' : 'webkitTransitionEnd',
    //       'MozTransition'    : 'transitionend',
    //       'OTransition'      : 'oTransitionEnd',
    //       'msTransition'     : 'MSTransitionEnd',
    //       'transition'       : 'transitionend'
    //     },
    //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
        // Testing DOM property e.g. Modernizr.prefixed('requestAnimationFrame', window) // 'mozRequestAnimationFrame'
        return testPropsAll(prop, obj, elem);
      }
    };
    /*>>prefixed*/


    /*>>cssclasses*/
    // Remove "no-js" class from <html> element, if it exists:
    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                            // Add the new classes to the <html> element.
                            (enableClasses ? ' js ' + classes.join(' ') : '');
    /*>>cssclasses*/

    return Modernizr;

})(this, this.document);
var glass_containers = {
  "type": "FeatureCollection",
  "generator": "overpass-turbo",
  "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.",
  "timestamp": "2014-02-22T11:05:02Z", 
  "features": [
    {
      "type": "Feature",
      "id": "node/279799202",
      "properties": {
        "@id": "node/279799202",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.4862741,
          52.0793236
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/279804512",
      "properties": {
        "@id": "node/279804512",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.4783674,
          52.0851631
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/296923021",
      "properties": {
        "@id": "node/296923021",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.9828624,
          51.9562921
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/305980498",
      "properties": {
        "@id": "node/305980498",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'
,
        "source": "survey"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.4668092,
          52.0816655
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/307655029",
      "properties": {
        "@id": "node/307655029",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.4747469,
          52.0805448
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/358147580",
      "properties": {
        "@id": "node/358147580",
        "addr:city": "Warendorf",
        "addr:country": "DE",
        "addr:postcode": "48231",
        "amenity": "recycling",
        "building": "yes",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling:paper": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.9636579,
          51.9213344
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/384952160",
      "properties": {
        "@id": "node/384952160",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.3632944,
          51.9261428
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/390267872",
      "properties": {
        "@id": "node/390267872",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6871559,
          51.9283745
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/441805004",
      "properties": {
        "@id": "node/441805004",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling:paper": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.9497987,
          51.9221985
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/441805006",
      "properties": {
        "@id": "node/441805006",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling:paper": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.9714948,
          51.9295596
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/512393624",
      "properties": {
        "@id": "node/512393624",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.0863403,
          51.8371928
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/538973666",
      "properties": {
        "@id": "node/538973666",
        "amenity": "recycling",
        "glass": "yes",
        "glass_bottles": "yes",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6182264,
          51.9693506
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/546290439",
      "properties": {
        "@id": "node/546290439",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.644307,
          51.9540782
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/551316494",
      "properties": {
        "@id": "node/551316494",
        "amenity": "recycling",
        "recycling:batteries": "no",
        "recycling:books": "no",
        "recycling:cans": "no",
        "recycling:cardboard": "no",
        "recycling:cartons": "no",
        "recycling:clothes": "yes",
        "recycling:electrical_appliances": "no",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling:green_waste": "no",
        "recycling:magazines": "no",
        "recycling:newspaper": "no",
        "recycling:paper": "no",
        "recycling:paper_packaging": "no",
        "recycling:plastic": "no",
        "recycling:plastic_bottles": "no",
        "recycling:plastic_packaging": "no",
        "recycling:scrap_metal": "no",
        "recycling:small_appliances": "no",
        "recycling:waste": "no",
        "recycling:wood": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6484121,
          51.9523835
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/551319644",
      "properties": {
        "@id": "node/551319644",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6355548,
          51.9598533
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/558548677",
      "properties": {
        "@id": "node/558548677",
        "amenity": "recycling",
        "recycling:batteries": "no",
        "recycling:cans": "no",
        "recycling:glass": "yes",
        "recycling:paper": "no",
        "recycling:scrap_metal": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6315131,
          51.9641603
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/559093957",
      "properties": {
        "@id": "node/559093957",
        "amenity": "recycling",
        "recycling:batteries": "no",
        "recycling:cans": "no",
        "recycling:clothes": "no",
        "recycling:glass": "yes",
        "recycling:paper": "no",
        "recycling:scrap_metal": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6276348,
          51.9040794
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/581396592",
      "properties": {
        "@id": "node/581396592",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.5382361,
          52.1750903
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/896451699",
      "properties": {
        "@id": "node/896451699",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0579224,
          52.1477973
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/899665335",
      "properties": {
        "@id": "node/899665335",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0557229,
          52.201385
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/913720693",
      "properties": {
        "@id": "node/913720693",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6017285,
          51.9704458
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/913720694",
      "properties": {
        "@id": "node/913720694",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:paper": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.602599,
          51.9701233
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1106449838",
      "properties": {
        "@id": "node/1106449838",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.1336993,
          51.6641269
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1117252553",
      "properties": {
        "@id": "node/1117252553",
        "amenity": "recycling",
        "recycling:green_waste": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0492952,
          52.1563749
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1142603992",
      "properties": {
        "@id": "node/1142603992",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6078854,
          51.9872107
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1324048354",
      "properties": {
        "@id": "node/1324048354",
        "amenity": "recycling",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0356993,
          51.6676281
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1376053034",
      "properties": {
        "@id": "node/1376053034",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8032633,
          52.2157459
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1392381619",
      "properties": {
        "@id": "node/1392381619",
        "amenity": "recycling",
        "recycling:cartons": "yes",
        "recycling:glass": "no",
        "recycling:glass_bottles": "yes",
        "recycling:newspaper": "yes",
        "recycling:paper": "yes",
        "recycling:paper_packaging": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0013716,
          51.9472787
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1396715358",
      "properties": {
        "@id": "node/1396715358",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6277044,
          51.9549748
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1402322292",
      "properties": {
        "@id": "node/1402322292",
        "amenity": "recycling",
        "name": "Altglas",
        "recycling:batteries": "no",
        "recycling:books": "no",
        "recycling:cans": "no",
        "recycling:cardboard": "no",
        "recycling:cartons": "no",
        "recycling:clothes": "no",
        "recycling:electrical_appliances": "no",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling:green_waste": "no",
        "recycling:magazines": "no",
        "recycling:newspaper": "no",
        "recycling:paper": "no",
        "recycling:paper_packaging": "no",
        "recycling:plastic": "no",
        "recycling:plastic_bottles": "no",
        "recycling:plastic_packaging": "no",
        "recycling:scrap_metal": "no",
        "recycling:small_appliances": "no",
        "recycling:waste": "no",
        "recycling:wood": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8203318,
          51.6718274
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1408494659",
      "properties": {
        "@id": "node/1408494659",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8289181,
          51.6654799
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1417026875",
      "properties": {
        "@id": "node/1417026875",
        "amenity": "recycling",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.7621414,
          51.6943485
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1423898092",
      "properties": {
        "@id": "node/1423898092",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8008167,
          51.7002114
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1505087947",
      "properties": {
        "@id": "node/1505087947",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.3371182,
          52.1447491
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1505087985",
      "properties": {
        "@id": "node/1505087985",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.3311321,
          52.1470795
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1513344253",
      "properties": {
        "@id": "node/1513344253",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.3140247,
          52.1547243
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1523180519",
      "properties": {
        "@id": "node/1523180519",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8850642,
          51.6863142
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1526159178",
      "properties": {
        "@id": "node/1526159178",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8123129,
          52.2153124
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1526159180",
      "properties": {
        "@id": "node/1526159180",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8123151,
          52.2153293
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1546290013",
      "properties": {
        "@id": "node/1546290013",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6595461,
          51.9038162
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1576752784",
      "properties": {
        "@id": "node/1576752784",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.365979,
          51.9274331
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1616139062",
      "properties": {
        "@id": "node/1616139062",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.5371261,
          52.1747855
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1639434135",
      "properties": {
        "@id": "node/1639434135",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6409737,
          51.9714702
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1639435145",
      "properties": {
        "@id": "node/1639435145",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6405751,
          51.9710425
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1639451272",
      "properties": {
        "@id": "node/1639451272",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6465901,
          51.9759232
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1639453097",
      "properties": {
        "@id": "node/1639453097",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6465257,
          51.977202
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1639459405",
      "properties": {
        "@id": "node/1639459405",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.649283,
          51.9708176
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1639513975",
      "properties": {
        "@id": "node/1639513975",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6574152,
          51.9678369
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1639663136",
      "properties": {
        "@id": "node/1639663136",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6360599,
          51.9763209
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1645514661",
      "properties": {
        "@id": "node/1645514661",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass_bottles": "yes",
        "recycling:paper": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6072746,
          52.0924775
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1654644600",
      "properties": {
        "@id": "node/1654644600",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6107413,
          51.9731414
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1654647876",
      "properties": {
        "@id": "node/1654647876",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6051443,
          51.9744645
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1709591396",
      "properties": {
        "@id": "node/1709591396",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6063882,
          51.9760302
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1711549132",
      "properties": {
        "@id": "node/1711549132",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.2655013,
          51.8377377
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1721079241",
      "properties": {
        "@id": "node/1721079241",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling:shoes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.1112681,
          52.2561233
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1763572580",
      "properties": {
        "@id": "node/1763572580",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0057895,
          52.2451378
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1766796958",
      "properties": {
        "@id": "node/1766796958",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.1666654,
          51.6690748
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1769244233",
      "properties": {
        "@id": "node/1769244233",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling:paper": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.187509,
          52.2074076
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1774682670",
      "properties": {
        "@id": "node/1774682670",
        "amenity": "recycling",
        "name": "Bekleidung",
        "recycling:batteries": "no",
        "recycling:books": "no",
        "recycling:cans": "no",
        "recycling:cardboard": "no",
        "recycling:cartons": "no",
        "recycling:clothes": "yes",
        "recycling:electrical_appliances": "no",
        "recycling:glass": "no",
        "recycling:glass_bottles": "no",
        "recycling:green_waste": "no",
        "recycling:magazines": "no",
        "recycling:newspaper": "no",
        "recycling:paper": "no",
        "recycling:paper_packaging": "no",
        "recycling:plastic": "no",
        "recycling:plastic_bottles": "no",
        "recycling:plastic_packaging": "no",
        "recycling:scrap_metal": "no",
        "recycling:small_appliances": "no",
        "recycling:waste": "no",
        "recycling:wood": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6446666,
          51.9806732
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1795623142",
      "properties": {
        "@id": "node/1795623142",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6482468,
          51.9566905
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1801091748",
      "properties": {
        "@id": "node/1801091748",
        "amenity": "recycling",
        "glass": "yes",
        "glass_bottles": "yes",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6715909,
          51.9249474
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1801726552",
      "properties": {
        "@id": "node/1801726552",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'
,
        "source": "survey"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8100579,
          51.6974681
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1801879736",
      "properties": {
        "@id": "node/1801879736",
        "amenity": "recycling",
        "clothes": "yes",
        "recycling:clothes": "yes",
        "recycling:shoes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'
,
        "shoes": "yes"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6716677,
          51.924874
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1853318545",
      "properties": {
        "@id": "node/1853318545",
        "amenity": "recycling",
        "name": "Glascontainer",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0819263,
          52.1451336
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1867755057",
      "properties": {
        "@id": "node/1867755057",
        "amenity": "recycling",
        "name": "Altglascontainer",
        "recycling:batteries": "no",
        "recycling:books": "no",
        "recycling:cans": "no",
        "recycling:cardboard": "no",
        "recycling:cartons": "no",
        "recycling:clothes": "no",
        "recycling:electrical_appliances": "no",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling:green_waste": "no",
        "recycling:magazines": "no",
        "recycling:newspaper": "no",
        "recycling:paper": "no",
        "recycling:paper_packaging": "no",
        "recycling:plastic": "no",
        "recycling:plastic_bottles": "no",
        "recycling:plastic_packaging": "no",
        "recycling:scrap_metal": "no",
        "recycling:small_appliances": "no",
        "recycling:waste": "no",
        "recycling:wood": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.5963234,
          51.9714304
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1969827264",
      "properties": {
        "@id": "node/1969827264",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.4669524,
          52.0774784
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/1987256406",
      "properties": {
        "@id": "node/1987256406",
        "amenity": "recycling",
        "recycling:green_waste": "yes",
        "recycling:plastic": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0480698,
          52.1570213
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2038045637",
      "properties": {
        "@id": "node/2038045637",
        "amenity": "recycling",
        "recycling:batteries": "no",
        "recycling:books": "no",
        "recycling:cans": "no",
        "recycling:cardboard": "no",
        "recycling:cartons": "no",
        "recycling:electrical_appliances": "no",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling:green_waste": "no",
        "recycling:magazines": "no",
        "recycling:newspaper": "no",
        "recycling:paper": "no",
        "recycling:paper_packaging": "no",
        "recycling:plastic": "no",
        "recycling:plastic_bottles": "no",
        "recycling:plastic_packaging": "no",
        "recycling:scrap_metal": "no",
        "recycling:waste": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.7931314,
          52.1350057
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2042341158",
      "properties": {
        "@id": "node/2042341158",
        "amenity": "recycling",
        "name": "Glascontainer",
        "recycling:batteries": "no",
        "recycling:books": "no",
        "recycling:cans": "no",
        "recycling:cardboard": "no",
        "recycling:cartons": "no",
        "recycling:clothes": "no",
        "recycling:electrical_appliances": "no",
        "recycling:glass": "no",
        "recycling:glass_bottles": "yes",
        "recycling:green_waste": "no",
        "recycling:magazines": "no",
        "recycling:newspaper": "no",
        "recycling:paper": "no",
        "recycling:paper_packaging": "no",
        "recycling:plastic": "no",
        "recycling:plastic_bottles": "no",
        "recycling:plastic_packaging": "no",
        "recycling:scrap_metal": "no",
        "recycling:small_appliances": "no",
        "recycling:waste": "no",
        "recycling:wood": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.7253846,
          51.9158965
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2049017580",
      "properties": {
        "@id": "node/2049017580",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0676435,
          52.1969415
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2049017614",
      "properties": {
        "@id": "node/2049017614",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0672521,
          52.1978773
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2068149461",
      "properties": {
        "@id": "node/2068149461",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6251235,
          51.9318082
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2085889755",
      "properties": {
        "@id": "node/2085889755",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0580068,
          52.2026097
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2087274335",
      "properties": {
        "@id": "node/2087274335",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0641667,
          52.2077729
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2097291376",
      "properties": {
        "@id": "node/2097291376",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0682145,
          52.1906748
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2101983248",
      "properties": {
        "@id": "node/2101983248",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6454903,
          51.960304
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2108040095",
      "properties": {
        "@id": "node/2108040095",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8090728,
          51.6775397
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2109016184",
      "properties": {
        "@id": "node/2109016184",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0619341,
          52.1936066
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2116554586",
      "properties": {
        "@id": "node/2116554586",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8736287,
          51.680594
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2149242778",
      "properties": {
        "@id": "node/2149242778",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0748843,
          52.1962358
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2149242938",
      "properties": {
        "@id": "node/2149242938",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:paper": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0683612,
          52.2060806
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2149242939",
      "properties": {
        "@id": "node/2149242939",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0687058,
          52.2064866
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2149242943",
      "properties": {
        "@id": "node/2149242943",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0666297,
          52.2074793
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2149242944",
      "properties": {
        "@id": "node/2149242944",
        "amenity": "recycling",
        "operator": "Kolpingwerk",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0660515,
          52.2075226
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2154392436",
      "properties": {
        "@id": "node/2154392436",
        "amenity": "recycling",
        "name": "Glas-Container",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.1189743,
          51.6792721
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2154394446",
      "properties": {
        "@id": "node/2154394446",
        "amenity": "recycling",
        "name": "Glas-Container",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.11696,
          51.6809552
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2156912243",
      "properties": {
        "@id": "node/2156912243",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0020739,
          52.0946968
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2180426967",
      "properties": {
        "@id": "node/2180426967",
        "amenity": "recycling",
        "name": "Glas",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6280845,
          51.9460567
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2183603315",
      "properties": {
        "@id": "node/2183603315",
        "amenity": "recycling",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.0486557,
          52.2002741
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2199770582",
      "properties": {
        "@id": "node/2199770582",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6454103,
          51.9620868
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2239810928",
      "properties": {
        "@id": "node/2239810928",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8620603,
          51.6819818
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2281102871",
      "properties": {
        "@id": "node/2281102871",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling:magazines": "yes",
        "recycling:newspaper": "yes",
        "recycling:paper": "yes",
        "recycling:paper_packaging": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.7039318,
          51.9814361
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2293725607",
      "properties": {
        "@id": "node/2293725607",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6198322,
          51.9587828
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2300750418",
      "properties": {
        "@id": "node/2300750418",
        "amenity": "recycling",
        "recycling:batteries": "no",
        "recycling:books": "no",
        "recycling:cans": "no",
        "recycling:cardboard": "no",
        "recycling:cartons": "no",
        "recycling:clothes": "no",
        "recycling:electrical_appliances": "no",
        "recycling:glass": "no",
        "recycling:glass_bottles": "yes",
        "recycling:green_waste": "no",
        "recycling:magazines": "no",
        "recycling:newspaper": "no",
        "recycling:paper": "no",
        "recycling:paper_packaging": "no",
        "recycling:plastic": "no",
        "recycling:plastic_bottles": "no",
        "recycling:plastic_packaging": "no",
        "recycling:scrap_metal": "no",
        "recycling:small_appliances": "no",
        "recycling:waste": "no",
        "recycling:wood": "no",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.5921841,
          51.9977183
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2320510295",
      "properties": {
        "@id": "node/2320510295",
        "amenity": "recycling",
        "name": "Glas Container",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8796276,
          51.6903481
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2323320691",
      "properties": {
        "@id": "node/2323320691",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8991859,
          51.6847918
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2337197122",
      "properties": {
        "@id": "node/2337197122",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6176911,
          51.9631411
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2354829004",
      "properties": {
        "@id": "node/2354829004",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling:small_appliances": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6409828,
          51.8990231
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2362228018",
      "properties": {
        "@id": "node/2362228018",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6308922,
          51.9668795
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2367816263",
      "properties": {
        "@id": "node/2367816263",
        "amenity": "recycling",
        "recycling:small_appliances": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.9033143,
          51.8698821
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2367816267",
      "properties": {
        "@id": "node/2367816267",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.903265,
          51.8698821
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2367816270",
      "properties": {
        "@id": "node/2367816270",
        "amenity": "recycling",
        "recycling:paper": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.9033592,
          51.8698821
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2367816274",
      "properties": {
        "@id": "node/2367816274",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.9034074,
          51.8698821
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2384149860",
      "properties": {
        "@id": "node/2384149860",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling:small_appliances": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.4804934,
          52.2558818
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2386478422",
      "properties": {
        "@id": "node/2386478422",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.861262,
          51.6911157
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2404808289",
      "properties": {
        "@id": "node/2404808289",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.597008,
          51.9892521
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2404808294",
      "properties": {
        "@id": "node/2404808294",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.5991591,
          51.9934572
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2440502060",
      "properties": {
        "@id": "node/2440502060",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8705211,
          51.6911212
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2440576302",
      "properties": {
        "@id": "node/2440576302",
        "amenity": "recycling",
        "name": "DRK",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8743976,
          51.6717918
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2440576310",
      "properties": {
        "@id": "node/2440576310",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.874327,
          51.671782
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2466626719",
      "properties": {
        "@id": "node/2466626719",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.826016,
          51.6725531
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2484288503",
      "properties": {
        "@id": "node/2484288503",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.873289,
          51.6747217
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2484408237",
      "properties": {
        "@id": "node/2484408237",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8695546,
          51.6832235
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2487642542",
      "properties": {
        "@id": "node/2487642542",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.7835693,
          51.6892268
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2487645891",
      "properties": {
        "@id": "node/2487645891",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.7799394,
          51.693335
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2487645892",
      "properties": {
        "@id": "node/2487645892",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.780001,
          51.693216
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2505185314",
      "properties": {
        "@id": "node/2505185314",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.3162777,
          52.2122174
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2526397133",
      "properties": {
        "@id": "node/2526397133",
        "amenity": "recycling",
        "glass": "yes",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.5478016,
          51.9939667
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2529986771",
      "properties": {
        "@id": "node/2529986771",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.1108037,
          52.0292157
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2529986779",
      "properties": {
        "@id": "node/2529986779",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.1058967,
          52.0273855
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2529986783",
      "properties": {
        "@id": "node/2529986783",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.1104909,
          52.0313744
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2529986787",
      "properties": {
        "@id": "node/2529986787",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.1082476,
          52.0395852
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2529986791",
      "properties": {
        "@id": "node/2529986791",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.0925414,
          52.0325113
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2529986794",
      "properties": {
        "@id": "node/2529986794",
        "amenity": "recycling",
        "recycling:glass": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.1027999,
          52.0333548
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2547845412",
      "properties": {
        "@id": "node/2547845412",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.8858928,
          51.6890898
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2552901833",
      "properties": {
        "@id": "node/2552901833",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.1629518,
          52.2387153
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2552902462",
      "properties": {
        "@id": "node/2552902462",
        "amenity": "recycling",
        "clothes": "yes",
        "recycling:clothes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.1629491,
          52.2387498
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2563196915",
      "properties": {
        "@id": "node/2563196915",
        "amenity": "recycling",
        "clothes": "yes",
        "glass": "yes",
        "glass_bottles": "yes",
        "recycling:clothes": "yes",
        "recycling:glass": "yes",
        "recycling:glass_bottles": "yes",
        "recycling:shoes": "yes",
        "recycling:small_appliances": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'
,
        "shoes": "yes"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6772699,
          51.9221015
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2612118108",
      "properties": {
        "@id": "node/2612118108",
        "amenity": "recycling",
        "recycling:small_appliances": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6078959,
          51.9872372
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2612351881",
      "properties": {
        "@id": "node/2612351881",
        "amenity": "recycling",
        "recycling:clothes": "yes",
        "recycling:shoes": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.5988917,
          51.9929303
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2617541887",
      "properties": {
        "@id": "node/2617541887",
        "amenity": "recycling",
        "recycling:small_appliances": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.61287,
          51.9951931
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2617541889",
      "properties": {
        "@id": "node/2617541889",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6129028,
          51.9953406
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2625743898",
      "properties": {
        "@id": "node/2625743898",
        "amenity": "recycling",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          7.6422933,
          51.961533
        ]
      }
    },
    {
      "type": "Feature",
      "id": "node/2630065142",
      "properties": {
        "@id": "node/2630065142",
        "amenity": "recycling",
        "recycling:glass_bottles": "yes",
        "recycling_type": "container", 
        'marker-size': 'small',
        'marker-color': '#E93333'

      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.1662666,
          52.2439567
        ]
      }
    }
  ]
}
;


