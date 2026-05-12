vis1 = false;
page1 = 1; // items search page
page2 = 1; // fridge display page
items1 = []; // search items arr
items2 = []; // fridge display items arr
reportArr = [];
last_collapse_id = null;
curr_collapse_id = null;
id_to_delete = null;
let populateFridgeGlobal = null;
let testVar = 1;
let testFunc = null;
edit_mode = false;     
let sort_selection = null;
loaded = [false, false, false, false, false, false];
one_active = null;



window.onload = async () => {
    let open_elem = document.getElementById('open-button');
    let fridge_elem = document.getElementById('fridge-display');
    let items_elem = document.getElementById('fridge-grid');
    let log_elem = document.getElementById('item-info');
    let fridge_pag_elem = document.getElementById('fridge-pag-arrows');
    let remove_elem = document.getElementById('remove-button');
    let edit_elem = document.getElementById('edit-button');

    async function setSort(){
        try {
            const response = await fetch("getitems.php?getSortMethod=true", {
              method: "GET",
            });
            let result = await response.json();
            arr = Array.from(result);
            sort_selection = arr[0][0];
            select_elem = document.getElementById('sort-options');
            select_elem.selectedIndex = sort_selection - 1;
          } catch (e) {
            console.error(e);
          }
    }

    await setSort();

    async function populateFridge(){
        try {
            const response = await fetch("getitems.php?getUserItems=true&sort_by="+sort_selection, {
              method: "GET",
            });
          let result = await response.json();
            arr = Array.from(result);
            items2 = arr;
            if(items2[0][0] == null){
                items_elem.children[0].children[0].src = "http://localhost:8888/pixel_fridge/pics/biink.png";
                items_elem.children[0].id = 'empty';
                log_elem.style.display = 'none'
            }
            else{
            page2 = 1;
            let itemCount = items2[0].length - 1;
            for(i = 0; i < 12; i++){
                let img_elem = items_elem.children[i].children[0];
                if(items2[0][i] == null){
                    img_elem.src = "http://localhost:8888/pixel_fridge/pics/biink.png";
                    items_elem.children[i].id = 'empty';
                }
                else{
                    img_elem.src = "http://localhost:8888/pixel_fridge/pics/items/" + items2[0][i][0];
                    items_elem.children[i].id = items2[0][i][1];
                    let exp_date = new Date(items2[0][i][2] + "T00:00:00");
                    let cur_date = new Date(Date.now());
                    cur_date.setMilliseconds(0);
                    cur_date.setSeconds(0);
                    cur_date.setMinutes(0);
                    cur_date.setHours(0);

                    if(items2[0][i][3] == 0){
                        items_elem.children[i].children[0].style.opacity = '0.5';
                        items_elem.children[i].children[2].innerText = "RAN OUT";
                        items_elem.children[i].style.backgroundColor = 'transparent';

                    }
                    else if(exp_date.valueOf() < cur_date.valueOf()){
                        items_elem.children[i].style.backgroundColor = 'rgb(255,185,185)';
                        items_elem.children[i].children[0].style.opacity = '1';
                        items_elem.children[i].children[2].innerText = "";
                    }
                    else if((exp_date.valueOf() - cur_date.valueOf()) <= (2*24*60*60*1000)){
                        items_elem.children[i].style.backgroundColor = 'rgb(255,255,153)';
                        items_elem.children[i].children[0].style.opacity = '1';
                        items_elem.children[i].children[2].innerText = "";
                    }
                } 
            }
        }
          } catch (e) {
            console.error(e);
          }
    }

    populateFridge();
    populateFridgeGlobal = populateFridge;


    open_elem.onclick = () => { 
        if(open_elem.innerText == 'Open'){
            open_elem.innerText = 'Close';
            fridge_elem.classList.add('col2-open');
            fridge_elem.classList.remove('col2-closed');
            items_elem.style.visibility = 'visible';
            if(!(items2[0][((12*(page2)))] == null)) document.getElementById('fridge-pag2').style.visibility = 'visible';
            else document.getElementById('fridge-pag2').style.visibility = 'hidden';
            if((page2==1)) document.getElementById('fridge-pag1').style.visibility = 'hidden';
            else document.getElementById('fridge-pag1').style.visibility = 'visible';
            displayItemsPage(page2);
        } 
        else{
            open_elem.innerText = 'Open';
            fridge_elem.classList.add('col2-closed');
            fridge_elem.classList.remove('col2-open');
            items_elem.style.visibility = 'hidden';
            log_elem.style.display = 'none';
            document.getElementById('fridge-pag1').style.visibility = 'hidden';
            document.getElementById('fridge-pag2').style.visibility = 'hidden';
            remove_elem.innerText = 'Remove item';
            edit_elem.innerText = 'Edit item';
            edit_mode = false;
            for(i = 1; i <= 12; i++){
                document.getElementById('remove-icon' + i).style.display = 'none'
            }
            modal_cancel.click();
            document.getElementById('remove-no').click();
        } 
    }

    let modal_cancel = document.getElementById('modal-cancel');
    modal_cancel.onclick = () => {
        document.getElementById('modal').classList.remove('modal-vis');
        document.getElementById('modal_quantity').value = '';
        document.getElementById('modal_man_date').value = '';
    }

    let modal_out = document.getElementById('modal-out');
    modal_out.onclick = () => {
        document.getElementById('modal_quantity').value = 0;
        document.getElementById('submit-for-edit').click();
        document.getElementById('modal_quantity').value = '';
        document.getElementById('modal_man_date').value = '';
    }

    let modal_form = document.getElementById('modal-form');

    async function sendItemData() {
        const formData = new FormData(modal_form);
        if(!edit_mode){
            try {
                const response = await fetch("getitems.php", {
                  method: "POST",
                  body: formData,
                });
              let result = await response.json();
                arr = Array.from(result);
                if(arr[0]){
                  document.getElementById('modal_id').value = '';
                  document.getElementById('modal_quantity').value = '';
                  document.getElementById('modal_man_date').value = '';
                  document.getElementById('modal').classList.remove('modal-vis');
                  document.getElementById('success-text').innerText = 'Item was added!';
                  document.getElementById('add-success').classList.add('success-modal-vis');
                  await populateFridge();
                  displayItemsPage(page2);

                  open_elem.innerText = 'Open';
                  open_elem.click();
                  setTimeout(() => {
                      document.getElementById('add-success').classList.remove('success-modal-vis');
                  }, 2000);
                }
              } catch (e) {
                console.error(e);
              }
        }
        else{
            try {
                const response = await fetch("getitems.php", {
                  method: "POST",
                  body: formData,
                });
                let result = await response.json();
                arr = Array.from(result);
                console.log(arr[0]);
                if(arr[0]){
                  document.getElementById('modal_log_id').value = '';
                  document.getElementById('modal_quantity').value = '';
                  document.getElementById('modal_man_date').value = '';
                  document.getElementById('modal').classList.remove('modal-vis');
                  document.getElementById('success-text').innerText = 'Item was updated!';
                  document.getElementById('add-success').classList.add('success-modal-vis');
                  edit_elem.click();

                  await showReport('collapse1');
                  await showReport('collapse1');

                  await showReport('collapse2');
                  await showReport('collapse2');

                  await showReport('collapse5');
                  await showReport('collapse5');

                  setTimeout(() => {
                      document.getElementById('add-success').classList.remove('success-modal-vis');
                  }, 2000);
                }
              } catch (e) {
                console.error(e);
              }

            // after done
            edit_mode = false;
        }
      }


      modal_form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendItemData();
      });

      remove_elem.onclick = async () => {
        if((remove_elem.innerText == 'Remove item') && (open_elem.innerText == 'Close') && !(items2[0][0] == null) && (edit_elem.innerText == 'Edit item')){           
            remove_elem.innerText = 'Cancel';
            for(i = 1; i <= 12; i++){
                if(!(items_elem.children[i-1].children[0].src == 'http://localhost:8888/pixel_fridge/pics/biink.png')){
                    document.getElementById('remove-icon' + i).innerHTML = "X";
                    document.getElementById('remove-icon' + i).style.display = 'inline';
                    items_elem.children[i-1].style.backgroundColor = 'transparent';
                }
                else document.getElementById('remove-icon' + i).style.display = 'none';
            }
        } 
        else if((open_elem.innerText == 'Close') && !(items2[0][0] == null) && (edit_elem.innerText == 'Cancel'));
        else{
            remove_elem.innerText = 'Remove item';
            for(i = 1; i <= 12; i++){
                document.getElementById('remove-icon' + i).style.display = 'none'
            }
            let temp = page2;
            await populateFridge();
            page2 = temp;
            displayItemsPage(temp);
        } 
    }

    edit_elem.onclick = async () => {
        if((edit_elem.innerText == 'Edit item') && (open_elem.innerText == 'Close') && !(items2[0][0] == null) && (remove_elem.innerText == 'Remove item')){           
            edit_elem.innerText = 'Cancel';
            for(i = 1; i <= 12; i++){
                if(!(items_elem.children[i-1].children[0].src == 'http://localhost:8888/pixel_fridge/pics/biink.png')){
                    document.getElementById('remove-icon' + i).innerHTML = "<img src='pics/edit.png' style='width:10px;'>";
                    document.getElementById('remove-icon' + i).style.display = 'inline';
                    items_elem.children[i-1].style.backgroundColor = 'transparent';
                }
                else document.getElementById('remove-icon' + i).style.display = 'none';
            }
        } 
        else if((open_elem.innerText == 'Close') && !(items2[0][0] == null) && (remove_elem.innerText == 'Cancel'));
        else{
            edit_elem.innerText = 'Edit item';
            for(i = 1; i <= 12; i++){
                document.getElementById('remove-icon' + i).style.display = 'none'
            }
            let temp = page2;
            await populateFridge();
            page2 = temp;
            displayItemsPage(temp);            
            edit_mode = false;
        } 
    }

    let col3_add_elem = document.getElementById('add-button');
    let col3_view_elem = document.getElementById('view-button');

    col3_add_elem.onclick = () => {
        document.getElementById('col3-home').style.display='none';
        document.getElementById('col3-add').style.display='flex';

    }

    col3_view_elem.onclick = () => {
        document.getElementById('col3-home').style.display='none';
        document.getElementById('col3-report').style.display='flex';
    }

    let col3_back_elem1 = document.getElementById('report-back');
    col3_back_elem1.onclick = () => {
        document.getElementById('col3-report').style.display='none';
        document.getElementById('col3-home').style.display='flex';
    }

    let col3_back_elem2 = document.getElementById('add-back');
    col3_back_elem2.onclick = () => {
        document.getElementById('col3-add').style.display='none';
        document.getElementById('col3-home').style.display='flex';
    }

    let sort_form = document.getElementById("item-sort-form");
    sort_form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(sort_form);
            try {
                const response = await fetch("getitems.php", {
                  method: "POST",
                  body: formData,
                });
              let result = await response.json();
                arr = Array.from(result);
                if (arr[0]){
                    await setSort();
                    await populateFridge();
                    open_elem.click();
                    open_elem.click();
                }
              } catch (e) {
                console.error(e);
              }
      });


} // end of window

function populateSearch(str){
    if (str.length == 0) {
        for(i = 0; i < 9; i++){
            document.getElementById('disp'+(i+1)).src = 'pics/biink.png';
        }
        document.getElementById('num-res').innerText = '';
        document.getElementById('pag-arrows').style.visibility = 'hidden';
        document.getElementById('item-name').style.visibility = 'hidden';
    } else {
        let regex = /^[a-zA-Z0-9]+$/;
        if(!regex.test(str)) return;

        const xmlhttp = new XMLHttpRequest();
        xmlhttp.onload = function() {
            let results1 = JSON.parse(this.responseText);
            arr = Array.from(results1);
            items1 = arr;
            page1 = 1;
            document.getElementById('num-res').innerText = 9*(page1-1)+1 + "-" + Math.min(arr.length, 9*page1) + " of " + arr.length + " results ";
            document.getElementById('pag-arrows').style.visibility = 'visible';
            for(i = 0; i < 9; i++){
                if(arr[i] != null){
                    document.getElementById('disp'+(i+1)).src = 'pics/items/' + arr[i];
                }
                else document.getElementById('disp'+(i+1)).src = 'pics/biink.png';
            }

        }
        xmlhttp.open("GET", "getitems.php?q="+str);
        xmlhttp.send();
    }
}

function displayItemsPage(page){
    let items_elem = document.getElementById('fridge-grid');
    let remove_elem = document.getElementById('remove-button');
    let edit_elem = document.getElementById('edit-button');
    let open_elem = document.getElementById('open-button');

    if((page==1) || (open_elem.innerText == 'Open')) document.getElementById('fridge-pag1').style.visibility = 'hidden';
    else document.getElementById('fridge-pag1').style.visibility = 'visible';

    if(items2[0][(12*(page-1))] == null){
        page2--;
    } 
    else{
        for(i = 0; i < 12; i++){
            let next_item = items2[0][((12*(page-1)+i))];
            if(next_item != null){
                items_elem.children[i].children[0].src = 'pics/items/' + next_item[0];
                items_elem.children[i].id = next_item[1];
                let exp_date = new Date(next_item[2] + "T00:00:00");
                let cur_date = new Date(Date.now());
                cur_date.setMilliseconds(0);
                cur_date.setSeconds(0);
                cur_date.setMinutes(0);
                cur_date.setHours(0);
                if(next_item[3] == 0){
                    items_elem.children[i].children[0].style.opacity = '0.5';
                    items_elem.children[i].children[2].innerText = "RAN OUT";
                    items_elem.children[i].style.backgroundColor = 'transparent';

                }
                else if(exp_date.valueOf() < cur_date.valueOf()){
                    items_elem.children[i].style.backgroundColor = 'rgb(255,185,185)';
                    items_elem.children[i].children[0].style.opacity = '1';
                    items_elem.children[i].children[2].innerText = "";
                }
                else if((exp_date.valueOf() - cur_date.valueOf()) <= (2*24*60*60*1000)){
                    items_elem.children[i].style.backgroundColor = 'rgb(255,255,153)';
                    items_elem.children[i].children[0].style.opacity = '1';
                    items_elem.children[i].children[2].innerText = "";
                }
                else{
                    items_elem.children[i].style.backgroundColor = 'transparent';
                    items_elem.children[i].children[0].style.opacity = '1';
                    items_elem.children[i].children[2].innerText = "";
                }
            }   
            else{
                items_elem.children[i].children[0].src = 'pics/biink.png';
                items_elem.children[i].id = 'empty';
                items_elem.children[i].style.backgroundColor = 'transparent';
                items_elem.children[i].children[0].style.opacity = '1';
                items_elem.children[i].children[2].innerText = "";
            }
        }

        if((items2[0][((12*(page)))] == null) || (open_elem.innerText == 'Open')) document.getElementById('fridge-pag2').style.visibility = 'hidden';
        else document.getElementById('fridge-pag2').style.visibility = 'visible';

        if(remove_elem.innerText == 'Cancel'){
            remove_elem.innerText = 'Remove item';
            remove_elem.click();
        }
        else if(edit_elem.innerText == 'Cancel'){
            edit_elem.innerText = 'Edit item';
            edit_elem.click();
        }
    }
}


function nextPg(arrow_id){
    switch(arrow_id){
        case 'search-pag':{
            if(items1[(page1*9)] == null);
            else{                        
                page1++;
                document.getElementById('num-res').innerText = document.getElementById('num-res').innerText = 9*(page1-1)+1 + "-" + Math.min(items1.length, 9*page1) + " of " + items1.length + " results ";
                for(i = 0; i < 9; i++){
                    if(items1[i + ((page1-1)*9)] != null){
                        document.getElementById('disp'+(i+1)).src = 'pics/items/' + items1[i + ((page1-1)*9)];
                    }
                    else document.getElementById('disp'+(i+1)).src = 'pics/biink.png';
                }
            }
            break;
        }
        case 'fridge-pag2':{
            page2++;
            displayItemsPage(page2);  
            break;
    }
}}

function prevPg(arrow_id){
    switch(arrow_id){
        case 'search-pag':{
            if(page1 == 1);
            else{
                page1 --;
                document.getElementById('num-res').innerText = document.getElementById('num-res').innerText = 9*(page1-1)+1 + "-" + Math.min(items1.length, 9*page1) + " of " + items1.length + " results ";
        
                for(i = 0; i < 9; i++){
                    document.getElementById('disp'+(i+1)).src = 'pics/items/' + items1[i + ((page1-1)*9)];
                }
            }
            break;
        }
        case 'fridge-pag1':{
            if(page2 == 1);
            else{
                page2 --;
                displayItemsPage(page2);
            }

            break;
        }
    }
}

function itemAdd(id){
    if(document.getElementById(id).childNodes[0].src == 'http://localhost:8888/pixel_fridge/pics/biink.png');
    else{
        modal_elem = document.getElementById('modal');
        document.getElementById('modal-pic').src = document.getElementById(id).childNodes[0].src;
        modal_elem.classList.add('modal-vis');

        const xmlhttp = new XMLHttpRequest();
        let file_name = document.getElementById('modal-pic').src.substr(46);
        xmlhttp.onload = function() {
            let results1 = JSON.parse(this.responseText);
            arr = Array.from(results1);
            document.getElementById('modal_name').value = arr[0];
            document.getElementById('modal_id').value = arr[1];
            document.getElementById('modal_exp_date').value = arr[2];
            document.getElementById('submit-for-add').style.display = 'inline';
            document.getElementById('submit-for-edit').style.display = 'none';
            document.getElementById('modal-out').style.display = 'none';

        }
        xmlhttp.open("GET", "getitems.php?pic_file_add="+file_name);
        xmlhttp.send();

    }

}


function dispName(id){
    if(document.getElementById(id).childNodes[0].src == 'http://localhost:8888/pixel_fridge/pics/biink.png');
    else{
        const xmlhttp = new XMLHttpRequest();
        let file_name = document.getElementById(id).childNodes[0].src.substr(46);
        xmlhttp.onload = function() {
            let results1 = JSON.parse(this.responseText);
            arr = Array.from(results1);
            document.getElementById('item-name').style.visibility = 'visible';
            document.getElementById('item-name').innerText = arr[0];
        }
        xmlhttp.open("GET", "getitems.php?pic_file="+file_name);
        xmlhttp.send();

    }
     
}

async function displayItemInfo(log_id){
    let log_elem = document.getElementById('item-info');

    if((log_id == 'empty'));
    else{
            try {
            const response = await fetch("getitems.php?getLog="+log_id, {
              method: "GET",
            });
            let result = await response.json();
            arr = Array.from(result);

            log_elem.style.display = 'flex';

            document.getElementById('iname').innerText = arr[0][0];

            if(arr[0][1] == null) document.getElementById('iquantity').innerText = "N/A";
            else document.getElementById('iquantity').innerText = arr[0][1];         
            
            document.getElementById('ilog').innerText = arr[0][4];

            if(arr[0][2] == null) document.getElementById('imade').innerText = "N/A";
            else document.getElementById('imade').innerText = arr[0][2];

            let exp_date = new Date(arr[0][3] + "T00:00:00");
            let cur_date = new Date(Date.now());
            cur_date.setMilliseconds(0);
            cur_date.setSeconds(0);
            cur_date.setMinutes(0);
            cur_date.setHours(0);

            if(exp_date.valueOf() < cur_date.valueOf()){
                document.getElementById('ilife').innerText = 'EXPIRED';
                document.getElementById('ilife').style.color = 'red';

            }
            else{
                if(((exp_date.valueOf() - cur_date.valueOf()) / (24*60*60*1000)) == 0)
                document.getElementById('ilife').innerText = "< 1 day";
                else if(((exp_date.valueOf() - cur_date.valueOf()) / (24*60*60*1000)) == 1) document.getElementById('ilife').innerText = "1 day"; 
                else document.getElementById('ilife').innerText = ((exp_date.valueOf() - cur_date.valueOf())) / (24*60*60*1000) + " days";
                document.getElementById('ilife').style.color = 'rgb(89,89,89)';
            }

            document.getElementById('iexp').innerText = arr[0][3];



            } catch (e) {
                console.error(e);
            }
    }
}

async function confirmRemoval(grid_id){   
    //this method will be used for edit as well, will rename DTL
    // let remove_elem = document.getElementById('remove-button');
    // let edit_elem = document.getElementById('edit-button');

    if(document.getElementById(grid_id).innerHTML == "X"){
        let log_id = document.getElementById(grid_id).parentElement.id;
        id_to_delete = log_id;
        let delete_elem = document.getElementById('delete-modal');
        document.getElementById('delete-pic').src = document.getElementById(grid_id).parentElement.children[0].src;
        delete_elem.style.display = 'flex';

        try {
            const response = await fetch("getitems.php?confirm_remove_id="+id_to_delete, {
              method: "GET",
            });
            let result = await response.json();
            arr = Array.from(result);
            document.getElementById('delete-name').innerText = arr[0];

            } catch (e) {
                console.error(e);
        }
    }
    else{
        edit_mode = true;
        let log_id = document.getElementById(grid_id).parentElement.id;
        console.log(document.getElementById(grid_id).parentElement.children[0]);

        modal_elem = document.getElementById('modal');
        modal_elem.classList.add('modal-vis');
        document.getElementById('modal-pic').src = document.getElementById(grid_id).parentElement.children[0].src;
        document.getElementById('submit-for-add').style.display = 'none';
        document.getElementById('submit-for-edit').style.display = 'inline';
        document.getElementById('modal-out').style.display = 'inline';

        try {
            const response = await fetch("getitems.php?getLog="+log_id, {
              method: "GET",
            });
            let result = await response.json();
            arr = Array.from(result);
            console.log(arr[0]);
            document.getElementById('modal_name').value = arr[0][0];
            document.getElementById('modal_log_id').value = log_id;
            document.getElementById('modal_quantity').value = arr[0][1];
            document.getElementById('modal_man_date').value = arr[0][2];
            document.getElementById('modal_exp_date').value = arr[0][3];
            document.getElementById('modal_fresh').value = arr[0][5];
            document.getElementById('tt1').innerText = arr[0][5];

            } catch (e) {
                console.error(e);
        }

    }

}

async function removeItem(confirm_id){
    let delete_elem = document.getElementById('delete-modal');
    switch(confirm_id){
        case 'remove-no':{
            delete_elem.style.display = 'none';
            break;
        }
        case 'remove-yes':{

            try {
                const response = await fetch("getitems.php?remove_id="+id_to_delete, {
                  method: "POST",
                });
                let result = await response.json();
                if(result[0]){
                    delete_elem.style.display = 'none';
                    await populateFridgeGlobal();
                    displayItemsPage(page2);
                    let remove_elem = document.getElementById('remove-button');
                    remove_elem.click();

                    await showReport('collapse2');
                    await showReport('collapse2');
 
                    await showReport('collapse5');
                    await showReport('collapse5');
                }
              } catch (e) {
                console.error(e);
              }
        }
    }
}

async function getReportInfo(reportID){
    const response = await fetch("getitems.php?reportCode="+reportID, {
        method: "GET",
      });
      let result = await response.json();
      arr = Array.from(result);
      reportArr = arr;
      console.log(arr);
      return arr;
}

async function showReport(reportID){
    report_elem = document.getElementById(reportID+"-report");
    arrow_elem = document.getElementById(reportID).children[0];
    list_elem = report_elem.children[0];

    curr_collapse_id = reportID;

    if(report_elem.style.display == 'none' || report_elem.style.display == ''){
        report_elem.style.display = 'inline';
        arrow_elem.src = 'http://localhost:8888/pixel_fridge/pics/up.png';
    }
    else{
        report_elem.style.display = 'none';
        arrow_elem.src = 'http://localhost:8888/pixel_fridge/pics/down.png';

    }

        try {
            let arr = await getReportInfo(reportID);
            list_elem.innerHTML = '';
            let last_item = '';
            let item_count = 1;

            switch(reportID){
                case "collapse1":
                case "collapse2":
                case "collapse4": // idk man
                case "collapse5":
                    for(i=0; i<arr[0].length; i++){
                        restock_item = document.createElement("li");
        
                        node = document.createTextNode(arr[0][i][0]);
                        restock_item.appendChild(node);
                        restock_item.style.marginBottom = "5px";
        
        
                        if(last_item == arr[0][i][0]){
                            hidden_entry = document.createElement("li");
                            item_txt = document.createTextNode(arr[0][i][0]);
                            hidden_entry.id = arr[0][i][1];
                            hidden_entry.appendChild(item_txt);

                            if(reportID == "collapse2"){
                                days_node = document.createElement("span").appendChild(document.createTextNode(" ["+arr[0][i][2]+" day(s) ago]"));
                            } 
                            else if(reportID == "collapse1"){
                                days_node = document.createElement("span").appendChild(document.createTextNode(" ["+arr[0][i][2]+" day(s) left]"));
                            }
                            else if(reportID == "collapse4" || reportID == "collapse5"){
                                days_node = document.createElement("span").appendChild(document.createTextNode(""));
                            }
                            hidden_entry.appendChild(days_node);
                            hidden_entry.style.marginBottom = "5px";
                            test1.appendChild(hidden_entry);
        
                            if(i==arr[0].length-1){
                                days_node = document.createElement("span").appendChild(document.createTextNode(" (" + (++item_count) +")"));
                                test1.previousElementSibling.appendChild(days_node);
                                addListView(test1.previousElementSibling, i-item_count+1, item_count);
                            }
                            item_count ++;
        
                        }
                        else{
                            console.log(arr[0][i][0] + " " + item_count)
                            if(i != 0){
                                days_node = document.createElement("span").appendChild(document.createTextNode(" (" + item_count +")"));
                                test1.previousElementSibling.appendChild(days_node);
                                addListView(test1.previousElementSibling, i-item_count, item_count);
                            }
        
                                list_elem.appendChild(restock_item);
        
                                test1 = document.createElement("ul");
        
                                restock_item.id = arr[0][i][1];
                                test1.id = "start-"+arr[0][i][1];
                                test1.style.display = "none";
        
                                list_elem.appendChild(test1);
        
        
                                if(i == arr[0].length-1){
                                    console.log(restock_item);
                                    days_node = document.createElement("span").appendChild(document.createTextNode(" (1)"));
                                    restock_item.appendChild(days_node);
                                    addListView(restock_item, i, 1);
                                }
                                
                                // addListView(restock_item);
                                item_count = 1;
        
                        }
                        
                        last_item = arr[0][i][0];
        
                    }
                    break;
                    case "collapse3": 
                        console.log("three");
                        break;
                    case "collapse5": 
                        console.log("three");
                        break;
                    case "collapse6": 
                        console.log("four");
                        break;
            }

        }catch{
            console.error(e);
        }

}


function addListView(start_elem, arrIndex, item_count){
    let index = 0;
    let box = 0;
    
    // console.log(start_elem);
    start_elem.onclick = async () => {
        console.log(start_elem);

        if(!(start_elem.parentElement.id.substr(0,6) == "start-")){ // days_past and item_count will only be used in this block
            // if(start_elem.nextElementSibling.children.length != 0){
                click_id = start_elem.parentElement.parentElement.previousElementSibling.id;
                await getReportInfo(click_id);

                if(start_elem.nextElementSibling.style.display == "block"){
                    start_elem.nextElementSibling.style.display = "none";
                    start_elem.innerText = reportArr[0][arrIndex][0] + " (" + item_count + ")";

                }
                else{
                    start_elem.nextElementSibling.style.display = "block";
                    if(click_id == "collapse1"){
                        start_elem.innerText = reportArr[0][arrIndex][0] +  " ["+reportArr[0][arrIndex][2]+" day(s) left]";
                    }
                    else if(click_id == "collapse2"){
                        start_elem.innerText = reportArr[0][arrIndex][0] +  " ["+reportArr[0][arrIndex][2]+" day(s) ago]";
                    }
                    else if(click_id == "collapse4" || click_id == "collapse5"){

                    }

                }
    
                for(i=0; i < start_elem.nextElementSibling.children.length; i++){
                    addListView(start_elem.nextElementSibling.children[i], null, null);
                }
            }
        // }
        else if(start_elem.parentElement.id.substr(0,6) == "start-"){
            // await getReportInfo(start_elem.parentElement.parentElement.previousElementSibling.id);

        }

        for(i=0; i<items2[0].length; i++){
            if(items2[0][i][1] == start_elem.id){
                index = Math.floor(i/12);
                break;
            }
        }

        let items_elem = document.getElementById('fridge-grid');
        displayItemsPage(index + 1);
        displayItemInfo(start_elem.id);

        for(i=0; i<items_elem.children.length; i++){
            if(items_elem.children[i].id == start_elem.id){
                box = i;
                break;
            }
        }

        page2 = index+1;
        items_elem.children[box].style.backgroundColor = 'dodgerblue';

        start_elem.style.color = 'dodgerblue';

        if(one_active == start_elem);
        else if (one_active == null){
            one_active = start_elem;
        }
        else{
            one_active.style.color = 'black';
            one_active = start_elem;
        }

    }


    start_elem.onmouseover = () => {
        start_elem.style.color = 'dodgerblue';
    }

    start_elem.onmouseout = () => {
        if(one_active == start_elem) start_elem.style.color = 'dodgerblue';

        else start_elem.style.color = 'black';
    }

}

async function getRecipes(){
    
    // try {
    //     const response = await fetch("www.themealdb.com/api/json/v1/1/list.php?i=sugar", {
    //       method: "GET",
    //     });
    //     let result = await response.json();
    //     console.log(result);
    //     // arr = Array.from(result);
    //     // list_elem.innerHTML = '';
    //     // let last_item = '';
    //     // let item_count = 1;

    // }catch{
    //     console.error(e);
    // }

    for(i=0; i<items2[0].length; i++){
        console.log(items2[0][i][4]);
    }

}

function dispFresh(modalID){
    tt_elem = document.getElementById("tt1");
    tt_elem.innerText = document.getElementById(modalID).value;
    if(document.getElementById(modalID).value <= 2){
        tt_elem.style.backgroundColor = "rgb(239, 133, 67)";
    }
    else if(document.getElementById(modalID).value <= 6){
        tt_elem.style.backgroundColor = "rgb(234, 225, 41)";
    }
    else if(document.getElementById(modalID).value <= 8){
        tt_elem.style.backgroundColor = "rgb(160, 234, 41)";
    }
    else{
        tt_elem.style.backgroundColor = "rgb(41, 234, 57)";
    }
}

