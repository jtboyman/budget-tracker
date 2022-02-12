let db;

const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('budget_change', {autoIncrement: true});
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadBudgetChange();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

//runs function is no internet 
function saveRecord(record) {
    //open a new transaction (temporary connection to db) with the database with read and write permissions
    const transaction = db.transaction(['budget_change'], 'readwrite');

    //access the object store for 'budget_change'
    const budgetObjectStore = transaction.objectStore('budget_change');

    //add record to store with add method
    budgetObjectStore.add(record);
};

function uploadBudgetChange() {
    //open transaction
    const transaction = db.transaction(['budget_change'], 'readwrite');

    //access object store
    const budgetObjectStore = transaction.objectStore('budget_change');

    //get all records from store and set to variable
    const getAll = budgetObjectStore.getAll();

    //if .getAll() executes:
    getAll.onsuccess = function() {
        //if there was data in indexedDb's store, send it to the api server
        if (getAll.result.length > 0) {
            fetch("/api/transaction", {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['budget_change'], 'readwrite');
                //access object objectStore
                const budgetObjectStore = transaction.objectStore('budget_change');
                //clear items from store
                budgetObjectStore.clear();

                alert('Offline budget changes have been saved!');
            })
            .catch(err => {
                console.log(err);
            });
        };
    };
};
// listen for app coming back online
window.addEventListener('online', uploadBudgetChange);