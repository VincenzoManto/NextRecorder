let path = '';
let tutorial = '';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    tutorial = request.tutorial;
    document.getElementById('tut').innerHTML = request.tutorial;
    document.getElementById('cs').innerHTML = request.script.replaceAll(';,', ';');
    hljs.highlightAll();
    document.getElementById('save').addEventListener('click', saveTutorial);
    path = request.firstPage.replace(/https:\/\/(.*?)\//, '').replace('/', '$');
});

function saveTutorial() {
    $('#save');
    $.ajax({
        type: 'POST',
        url: 'https://4sne.sys-web.it/ai/tutorial/stutorial.php?f=' + path,
        data: {
            content: tutorial
        },
        success: function(data) {
          //success code
        }
      });
}
