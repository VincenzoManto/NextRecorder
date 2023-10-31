let id = 100;
let actions = [];
let activate = false;
let firstFrame;
let firstPage;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request, sender);
    if (request.msg === 'capture') {
        const action = request.action;
        chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, {}, function(dataUrl) {
            console.log('inside capture');

            action.frame = dataUrl;
            actions.push(action);
            sendResponse({
                imgSrc: dataUrl,
                request,
                count: actions.length
            });


        });
    } else {
        for (let i = 0; i < actions.length; i++) {
            if (actions[i].action === 'write') {
                let text = actions[i].data;
                let j = i + 1;
                for (; j < actions.length; j++) {
                    if (actions[j].action !== 'write') {
                        break;
                    }
                    text += actions[j].data;
                }
                actions[i].data = text;
                actions.splice(i + 1, j - i - 1);
            }
        }
        const rows = [];
        for (let i = 0; i < actions.length; i++) {
            const e = actions[i];
            let action = "Clicca";
            let addendum = "";
            if (e.action === 'click select') action = "Popola <b>" + e.target + "</b>";
            if (e.action === 'select option') action = "Seleziona un'<b>opzione</b>";
            if (e.action === 'type') action = "Scrivi su <b>" + e.target + "</b>";
            if (e.action === 'click switch') action = "Valorizza <b>" + e.target + "</b>";
            if (e.action === 'click button') action = "Premi <b>" + e.target + "</b>";
            if (e.action === 'date') action = "Inserisci data <b>" + e.target + "</b>";
            if (e.action === 'write') action = "Scrivi \"<b>" + e.data + "</b>\"";

            if (e.action === 'click button' && e.target?.toLowerCase().includes("salva")) addendum = "Assicurati che il salvataggio vada a buon fine, il tutto è accompagnato da un popup verde in alto a destra. In caso contrario, ripeti i passaggi sopra";
            e.text = action;
            rows.push(`<div class="row p-3 border-bottom justify-content-center">
          <div class="col-12"><b class="bg-secondary text-white rounded-circle" style="padding: 0.5rem 0.8rem">${i + 1}</b> ${action}</div>
          ${ e.frame ? ('<div class="col-6 p-3"><img class="w-100" src="' + e.frame + '"></div>') : '' }<p>${addendum}</p></div>`);
        };


        const text = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" crossorigin="anonymous" referrerpolicy="no-referrer" /><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65" crossorigin="anonymous">
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.min.js" integrity="sha384-cuYeSxntonz0PPNlHhBs68uyIAVpIIOZZ5JqeqvYYIcEL727kskC66kF92t6Xl2V" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+jjXkk+Q2h455rYXK/7HAuoJl+0I4" crossorigin="anonymous"></script>
      <body contenteditable>
      <div class="border-bottom p-3 m-3 row justify-content-center"><img class="col-auto" style="max-width: 200px" src="https://4sne.sys-web.it/assets/images/logo.png"></div><h2 class="col-auto p-3">Manuale</h2></div>
      <h4 class="p-3">${firstPage}</h4>
      <div class="text-center">
      <img src="${firstFrame}" width="50%"><br>
        Analizziamo la procedura di inserimento <b>${firstPage}</b>
      </div>
      ${rows}
      </body>
      `;
        const newPage = window.open('', '_blank');
        newPage.document.write(text);
        chrome.tabs.create({url: chrome.extension.getURL('output.html')});
        const script = generateScript(actions);
        const tutorial = JSON.stringify(actions.map(e => ({data: e.data, action: e.action, text: e.text})));
        setTimeout(() => 
            chrome.runtime.sendMessage({
                msg: 'content',
                script,
                tutorial,
                firstPage
            }), 1000);
        activate = false;
        toggle(false); 
        sendResponse(actions);
        actions = [];
    }

    return true;
});

function generateScript(actions) {

    let text = `
        [TestMethod]
        [TestCategory("Chrome")]
        public void TheBingSearchTest()
        {
            Login();
            var wait = new WebDriverWait(driver, TimeSpan.FromMinutes(1));
            driver.Navigate().GoToUrl("${firstPage}");
            var title = driver.Title;
            driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromMilliseconds(15000);
            ${actions.map((e, i) => el(e, i))}
        }
    `;
    return text;
}

function el(e, i) {
    if (e.action.includes('select')) {
        return `
        var x${i} = driver.FindElement(By.CssSelector("[data-test=${e.data.replace('=g', '=')}] .select2-selection"));
        x${i}.Click();
        wait.Until(ElementIsClickable(By.CssSelector(".select2-results li:nth-child(1)")));
        driver.FindElement(By.CssSelector(".select2-results li:nth-child(1)"))?.Click();
            `;
    } else if (e.action === 'write') {
        return `
        new Actions(driver).SendKeys("${e.data}").Perform();`;
    } else if (e.data) {
        return `
        wait.Until(ElementIsClickable(By.CssSelector("[data-test=${e.data}]")));
        var x${i} = driver.FindElement(By.CssSelector("[data-test=${e.data}]"));
        x${i}.Click();`;
    } else if (e.xpath) {
        return `
        wait.Until(ElementIsClickable(By.XPath("${e.xpath}")));
        var x${i} = driver.FindElement(By.XPath("${e.xpath}"));
        x${i}.Click();`;
    }
}

function toggle(x) {
    activate = x;
    if (activate) {
        chrome.browserAction.setIcon({
            path: "logo-inverted.png"
        });
    } else {
        chrome.browserAction.setIcon({
            path: "logo.png"
        });
    }
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        // Send a message to the content script in the active tab
        chrome.tabs.sendMessage(tabs[0].id, {
            active: activate
        });
    });
}
chrome.browserAction.onClicked.addListener(() => {
    toggle(!activate);
    if (activate) {
        chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, {}, function(dataUrl) {
            chrome.tabs.getSelected(null,function(tab) {
                firstPage = tab.url;
            });
            firstFrame = dataUrl;
        });
    }



});