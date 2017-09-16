(function(master, settings){
    'use strict';

    Object.prototype.attachDomEvent = function(callback, eventName)
    {
        if(this.attachEvent) {
            this.attachEvent(eventName, callback);
        } else {
            if(this[eventName]) {
                var binder = this[eventName];
                var newonload = function(evt) {
                    binder(evt);
                    callback(evt);
                };
                this[eventName] = newonload;
            } else {
                this[eventName] = callback;
            }
        }

        return this;
    }

    Object.prototype.getVideoSource = function()
    {
        if ( this.dataset.videoMp4 ) {
            return {type: 'video/mp4', src: this.dataset.videoMp4};
        } else {
            return {type: null, src: null};
        }
    }

    Object.prototype.getOrCreateVideoPopupId = function()
    {
        if ( this.dataset.videoPopupId ) {
            return {created: false, id: this.dataset.videoPopupId};
        } else {
            this.setAttribute( 'data-video-popup-id', parseInt(Math.random() * (9999 - 1111) + 1111) );
            this.classList.add( 'btn-video-' + this.dataset.videoPopupId )
            return {created: true, id: this.dataset.videoPopupId};
        }
    }

    Object.prototype.getVideoHeading = function()
    {
        if ( this.dataset.videoHeading ) {
            return this.dataset.videoHeading;
        } else {
            return false;
        }
    }

    Object.prototype._videoJS = false;

    Object.prototype.getVideoPopupElement = function()
    {
        var popup = this.getOrCreateVideoPopupId()
          , video = this.getVideoSource()
          , popupElem, videoElem, sourceElem, videoHeading, videoHeadingSpan, videoClose;

        if ( popup.created ) {
            videoElem = document.createElement('video');
            videoElem.controls = true;
            videoElem.className = 'video-js';
            sourceElem = document.createElement('source');
            sourceElem.src = video.src;
            sourceElem.type = sourceElem.type;
            videoElem.appendChild(sourceElem);
            popupElem = document.createElement('div');
            popupElem.id = 'video-' + popup.id;
            popupElem.className = 'video-player-popup';

            if ( this.getVideoHeading() ) {
                videoHeading = document.createElement('h2');
                videoHeading.className = 'video-heading';
                videoHeadingSpan = document.createElement('span');
                videoHeadingSpan.innerHTML = this.getVideoHeading();
                videoHeading.appendChild(videoHeadingSpan);
                popupElem.classList.add('has-heading')
                popupElem.appendChild(videoHeading);
            }

            popupElem.appendChild(videoElem);
            videoClose = document.createElement('span');
            videoClose.className = 'close-video';
            videoClose.innerHTML = '&times;';
            videoClose.title = 'Close video (ESC)';
            videoClose.attachDomEvent(closePopupBtn, 'onclick');
            popupElem.appendChild(videoClose);

            if ( 'function' == typeof videojs ) {
                videojs(videoElem)
                popupElem._videoJS = true;
            }

            document.body.appendChild(popupElem);
        } else {
            popupElem = document.getElementById('video-' + popup.id)
        }

        return popupElem;
    }

    function parseButtonSettings(button)
    {
        var _settings = Object.assign({}, settings);

        if ( !button.dataset )
            return _settings;

        Object.keys(button.dataset).filter(function(k){
            if ( /^videoSetting/.test(k) ) {
                var value = button.dataset[k];
                k = k.replace(/^videoSetting/g, '');
                _settings[k.charAt(0).toLowerCase() + k.slice(1)] = value;
            }
        });

        return _settings;
    }

    function getSettings(button)
    {
        if ( !button ) {
            return settings;
        } else {
            return parseButtonSettings(button);
        }
    }

    function getPopupAssociatedButton(popup)
    {
        return document.getElementsByClassName( 'btn-' + popup.id )[0];
    }

    function currentDisplayedVideoPopup(elem)
    {
        if ( arguments.length ) {
            window.videoJSCurrentDisplayedVideoPopup = elem;
            return elem;
        } else {
            return window.videoJSCurrentDisplayedVideoPopup;
        }
    }

    master.dispatchVideoJS = function()
    {
        var buttons = document.getElementsByClassName('video-player')
          , button
          , popup;
        
        if ( buttons.length ) {
            for ( var index in buttons ) {
                if ( buttons.hasOwnProperty(index) ) {
                    button = buttons[index];

                    button.attachDomEvent(function(){

                        if ( popup = this.getVideoPopupElement() ) {
                            popup.classList.remove('v-hidden')
                            popup.classList.add('v-visible')
                            currentDisplayedVideoPopup(popup)
                            positionPopup(popup)

                            if ( popup.querySelector('video') ) {
                                popup.querySelector('video').play();
                            } else {
                                console.log( 'Could not play video, no video element found!', popup, button );
                            }
                        }

                    }, 'onclick');
                }
            }
        }
    }

    function closePopup(popup)
    {
        if ( popup.querySelector('video') ) {
            popup.querySelector('video').pause();
            popup.querySelector('video').currentTime = 0;
        } else {
            console.log( 'Could not pause video, no video element found!', popup );
        }

        popup.classList.add('v-hidden')
        popup.classList.remove('v-visible')
        currentDisplayedVideoPopup(null)
    }

    function closePopupBtn()
    {
        return closePopup( this.parentElement );
    }

    function getAbsoluteHeight(el)
    {
        el = (typeof el === 'string') ? document.querySelector(el) : el; 

        var styles = window.getComputedStyle(el);
        var margin = parseFloat(styles['marginTop']) +
                     parseFloat(styles['marginBottom']);

        return Math.ceil(el.offsetHeight + margin);
    }

    function getPopupVideoContainer(popup)
    {
        if ( popup._videoJS ) {
            return popup.children[ popup.className.indexOf('has-heading') > 0 ? 1 : 0 ]
        } else {
            return popup.children[ popup.className.indexOf('has-heading') > 0 ? 1 : 0 ]
        }
    }

    function positionPopup(popup)
    {
        var width, videoContainer, buttonSettings, height, heightInt
          , videoHeading, subtractHeight = 0;

        if ( window.innerWidth < settings.maxWidth ) {
            width = window.innerWidth;
        } else {
            width = settings.maxWidth;
        }

        videoContainer = getPopupVideoContainer(popup);

        videoContainer.style.width = width + 'px';
        buttonSettings = getSettings( getPopupAssociatedButton(popup) );

        if ( buttonSettings['maxHeight'] < window.innerHeight ) {
            height = parseInt(buttonSettings['maxHeight'])
        } else {
            height = window.innerHeight;
        }

        if ( videoHeading = popup.querySelector('.video-heading') ) {
            subtractHeight += videoHeading.scrollHeight
            height -= videoHeading.scrollHeight
        }

        videoContainer.style.height = height + 'px';

        try {
            videoContainer.offsetTop = videoContainer.getBoundingClientRect().top
        } catch (e) {}

        if ( popup.scrollHeight > window.innerHeight ) {
            height = window.innerHeight -videoContainer.offsetTop
            videoContainer.style.height = height + 'px';
        } else if ( height + subtractHeight < window.innerHeight ) {
            if ( videoHeading ) {
                videoContainer.classList.add('pos-absolute');
                videoContainer.classList.remove('pos-relative');
                videoContainer.style.top = (
                    window.innerHeight/2 -height/2 +videoHeading.scrollHeight/2
                ) + 'px';
                videoHeading.classList.add('pos-absolute');
                videoHeading.classList.remove('pos-relative');
                videoHeading.style.top = (
                    videoContainer.offsetTop -getAbsoluteHeight(videoHeading)
                ) + 'px';
            } else {
                videoContainer.classList.remove('pos-absolute');
                videoContainer.classList.add('pos-relative');
                videoContainer.style.top = (
                    (window.innerHeight - height + subtractHeight) /2
                ) + 'px';
            }
        }

        if ( videoHeading ) {
            videoHeading.style.width = width + 'px';
        }

        if ( width <= window.innerWidth ) {
            videoContainer.style.position = 'relative';
            videoContainer.style.left = (
                (window.innerWidth - width) /2
            ) + 'px';

            if ( videoHeading ) {
                videoHeading.style.position = 'relative';
                videoHeading.style.left = (
                    (window.innerWidth - width) /2
                ) + 'px';
            }
        }
    }

    function positionCurrentDisplayedPopup()
    {
        var popup;

        if ( popup = currentDisplayedVideoPopup() ) {
            return positionPopup(popup);
        }
    }

    master.videoJSonKeyDown = function()
    {
        if ( !currentDisplayedVideoPopup() )
            return;

        switch ( (event||this.event||window.event).which ) {
            case 27:
                closePopup(currentDisplayedVideoPopup())
                break;
        }
    }

    master.videoOnResizeEvent = function()
    {
        var popup, videoContainer;

        if ( popup = currentDisplayedVideoPopup() ) {
            videoContainer = getPopupVideoContainer(popup);

            if ( videoContainer.getBoundingClientRect().top <= 0 )
                return;

            if ( popup._videoJS ) {
                if ( /vjs-fullscreen/.test(videoContainer.className) ) {
                    setTimeout(function(videoContainer){
                        if ( !/vjs-fullscreen/.test(videoContainer.className) ) {
                            return positionCurrentDisplayedPopup();
                        }
                    }, 1, videoContainer);
                    positionCurrentDisplayedPopup();
                }
            }

            return positionPopup(popup);
        }
    }

})(window, {
    maxWidth: 700,
    maxHeight: 500,
});

(function(){
    window.attachDomEvent(window.dispatchVideoJS, 'onload')
    window.attachDomEvent(window.videoJSonKeyDown, 'onkeydown')
    window.attachDomEvent(window.videoOnResizeEvent, 'onresize')
})();