chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
   if (request.active) {

       var style = document.createElement('link');
       style.rel = 'stylesheet';
       style.className = 'sysdat';
       style.type = 'text/css';
       style.href = chrome.extension.getURL('style.css');
       (document.head || document.documentElement).appendChild(style);

       var x = document.createElement('div');
       x.className = 'sysdat-power';
       const url = chrome.runtime.getURL("next.png");
       x.innerHTML = `<img src="${url}" class="sysdat">`;
       (document.body || document.documentElement).appendChild(x);

       document.addEventListener('click', capture, false);
       var x2 = document.createElement('i');
       x2.className = 'far fa-stop text-danger sysdat';
       x2.addEventListener('click', stop, false);
       x.appendChild(x2);

       var x3 = document.createElement('div');
       x3.className = 'd-inline';
       x3.innerHTML = `<i class="fa fa-mouse-pointer sysdat m-0"></i> <b class="sysdat"></b>`;
       x.appendChild(x3);


       document.addEventListener('click', capture, false);
   } else {
       document.removeEventListener('click', capture);
       document.getElementsByClassName('sysdat')[0]?.remove();
       document.getElementsByClassName('sysdat-power')[0]?.remove();
   }
});

function capture(e) {
   let action = null;
   if (e.target.className?.includes('sysdat')) {
       return;
   }
   if ($(e.target).parents('stark-select').length) {
       action = {
           action: 'click select',
           target: $(e.target).parents('stark-select').first().find('label').text(),
           data: getDataTest(e)
       };
   }
   if (e.target.tagName?.toLowerCase() === 'button' || $(e.target).parents('button').length || $(e.target).parents('a').length) {
       let name = $(e.target).html() || ('<i class="' + e.target.className + '"></i>');
       action = {
           action: 'click button',
           target: name,
           data: getDataTest(e)
       }
   }
   if ($(e.target).parents('stark-input').length) {
       let name = $(e.target).html();
       if ($(e.target).parents('app-product-sizes').length) {
           name = 'taglia';
       }
       action = {
           action: 'type',
           value: $(e.target).val(),
           target: $(e.target).parents('stark-input').first().find('label').text(),
           data: getDataTest(e)
       };
   }
   if ($(e.target).parents('stark-datepicker').length) {

       action = {
           action: 'select date',
           value: $(e.target).val(),
           target: $(e.target).parents('stark-datepicker').first().find('label').text(),
           data: getDataTest(e)
       };
   }
   if (action) {
       action.title = document.title;
       chrome.runtime.sendMessage({
               msg: 'capture',
               action
           },
           function(response) {
               $('b.sysdat').text(response.count);
               console.log(response);
           }
       );
   }
}

function getDataTest(e) {
   return $(e.target).attr('data-test') || $(e.target).closest('[data-test]').first()?.attr('data-test');
}

function stop() {
   chrome.runtime.sendMessage({
       msg: 'stop'
   }, function(response) {
       console.log(response);
       actions = response;
       openPlay();
       play(0);
       document.removeEventListener('click', capture);
       document.getElementsByClassName('sysdat')[0]?.remove();
       document.getElementsByClassName('sysdat-power')[0]?.remove();
      
   });
}

actions = [];