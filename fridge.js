page1 = 1; // items search page
page2 = 1; // fridge display page
items1 = []; // search items arr
items2 = []; // fridge display items arr
reportArr = [];
let prevIngList = []; 
// if no ingredients are generated AFTER ingredients were generated prior, 
// the prior items will remain in the case that next time the ing list will still be the same (can avoid db call)
let recipeLinks = [];
let prevRecipeLinks = [];
let prevRecipeNames = [];
let ingList = [];
let recipeNames = [];
last_collapse_id = null;
id_to_delete = null;
let populateFridgeGlobal = null;
edit_mode = false;     
one_active = null;
let ip = null;
let uid = null;

window.onload = async () => {
    let open_elem = document.getElementById('open-button');
    let fridge_elem = document.getElementById('fridge-display');
    let items_elem = document.getElementById('fridge-grid');
    let log_elem = document.getElementById('item-info');
    let fridge_pag_elem = document.getElementById('fridge-pag-arrows');
    let remove_elem = document.getElementById('remove-button');
    let edit_elem = document.getElementById('edit-button');

    async function loadWelcome(){
        const { data: { session } } = await client.auth.getSession();
        uid = session.user.id;
        const {data, error} = await client.from('profiles').select('fname').eq('id',uid);
        document.getElementById("welcome").innerText = `${data[0].fname}'s Fridge`;
    }

    await loadWelcome()


    async function setSort(){
        sort_selection = localStorage.getItem('sort_selection') || 1
        select_elem = document.getElementById('sort-options');
        select_elem.selectedIndex = sort_selection - 1;
    }

    await setSort();

    // orient fridge properly on window load
    positionFridge();

    async function populateFridge(){
        let data1 = null;
        switch(localStorage.getItem('sort_selection') || 1){
            case 1:{
                const { data, error } = await client
                  .from('user_items')
                  .select(`
                    log_id,
                    expiry_date,
                    quantity,
                    items(pic_file)
                  `)
                  .eq('id', uid)
                  .order('log_date', { ascending: false })
                  .order('log_id', { ascending: false })
                data1 = data;
                break;
            }
            case 2:{
                const { data, error } = await client
                  .from('user_items')
                  .select(`
                    log_id,
                    expiry_date,
                    quantity,
                    items(pic_file)
                  `)
                  .eq('id', uid)
                  .order('log_date', { ascending: true })
                data1 = data;
                break;
            }
            case 3:{
                const { data, error } = await client
                  .from('user_items')
                  .select(`
                    log_id,
                    expiry_date,
                    quantity,
                    items(pic_file)
                  `)
                  .eq('id', uid)
                  .order('expiry_date', { ascending: false })
                  .order('log_id', { ascending: false })
                data1 = data;
                break;
            }
            case 4:{
                const { data, error } = await client
                  .from('user_items')
                  .select(`
                    log_id,
                    expiry_date,
                    quantity,
                    items(pic_file)
                  `)
                  .eq('id', uid)
                  .order('expiry_date', { ascending: true })
                data1 = data;
                break;
            }
        }

        items2 = data1;
        if(items2 == undefined || items2[0] == null){
            items_elem.children[0].children[0].src = "pics/biink.png";
            items_elem.children[0].id = 'empty';
            log_elem.style.display = 'none'
            page2 = 1;
        }
        else{
            page2 = 1;
            let itemCount = items2.length - 1;
            for(i = 0; i < 12; i++){
                let img_elem = items_elem.children[i].children[0];
                if(items2[i] == undefined || items2[i] == null){
                    img_elem.src = "pics/biink.png";
                    items_elem.children[i].id = 'empty';
                }
                else{
                    img_elem.src = "pics/items/" + items2[i].items.pic_file;
                    items_elem.children[i].id = items2[i].log_id;
                    let exp_date = new Date(items2[i].expiry_date + "T00:00:00");
                    let cur_date = new Date(Date.now());
                    cur_date.setMilliseconds(0);
                    cur_date.setSeconds(0);
                    cur_date.setMinutes(0);
                    cur_date.setHours(0);
                    if(items2[i].quantity == 0){
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
    }

    await populateFridge();
    str = items_elem.children[0].children[0].src;
    ip = str.substring(0, str.length-17);
    populateFridgeGlobal = populateFridge;


    open_elem.onclick = () => { 
        if(open_elem.innerText == 'Open'){
            open_elem.innerText = 'Close';
            fridge_elem.classList.add('col2-open');
            fridge_elem.classList.remove('col2-closed');
            items_elem.style.visibility = 'visible';
            if(!(items2[((12*(page2)))] == undefined || items2[12*page2] == null)) document.getElementById('fridge-pag2').style.visibility = 'visible';
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
        formData = new FormData(modal_form);

        if(!edit_mode){
            fresh_lvl = document.getElementById('modal_fresh').value;
            if(fresh_lvl != 10){
                id = document.getElementById('modal_id').value; // this is items.id in db
                fridge_days = 0;

                const {data, error} = await client.from('items').select('fridge_days').eq('id', id).single()
                fridge_days = data.fridge_days

                let expected_days = Math.round((fridge_days*fresh_lvl)/10); // underestimate the amount of days that should be left
                
                expiry_date = new Date(document.getElementById('modal_exp_date').value + "T00:00:00");
                current_date = new Date(Date.now());
                current_date.setMilliseconds(0);
                current_date.setSeconds(0);
                current_date.setMinutes(0);
                current_date.setHours(0);

                if((expiry_date.valueOf() - current_date.valueOf()) > (expected_days*24*60*60*1000)){
                    suggestedISO = new Date(current_date.valueOf()+(expected_days*24*60*60*1000)).toISOString().substring(0, 10);
                    if(confirm("Based on the freshness entered, the recommended expiry date is: \n" 
                    + suggestedISO + "\nProceed with recommended date?\n*Click cancel to ignore*")){
                        document.getElementById('modal_exp_date').value = suggestedISO;
                    }
                }
                //trying to alert if expiry exceeds what is suggested by freshness
            }

            formData = new FormData(modal_form);

            const {error} = await client.from('user_items').insert({
                id: uid,
                item_id: formData.get('id'),
                quantity: formData.get('quantity') == ''? null : formData.get('quantity'),
                manufacture_date: formData.get('man_date') == ''? null : formData.get('man_date'),
                expiry_date: formData.get('exp_date'),
                freshness: formData.get('freshness'),
                mod_date: new Date().toISOString().split('T')[0]
            })

            if(!error){
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
        }
        else{

            const {data} = await client.from('user_items').select('quantity, manufacture_date, expiry_date, freshness, mod_date, log_date').eq('log_id', formData.get('log_id')).single()

            const {error} = await client.from('user_items').update({
                quantity: formData.get('quantity') != ''? formData.get('quantity') : null,
                manufacture_date: formData.get('man_date') != ''? formData.get('man_date') : null,
                expiry_date: formData.get('exp_date') != data.expiry_date? formData.get('exp_date') : data.expiry_date,
                freshness: (formData.get('freshness') != data.freshness) || (formData.get('quantity') != 0 && data.quantity == 0)? data.freshness : data.freshness,
                mod_date: (formData.get('freshness') != data.freshness) || (formData.get('quantity') != 0 && data.quantity == 0)? new Date().toISOString().split('T')[0] : data.mod_date,
                log_date: formData.get('quantity') != 0 && data.quantity == 0? new Date().toISOString().split('T')[0] : data.log_date
            }).eq('log_id', formData.get('log_id'))

            document.getElementById('modal_log_id').value = '';
            document.getElementById('modal_quantity').value = '';
            document.getElementById('modal_man_date').value = '';
            document.getElementById('modal').classList.remove('modal-vis');
            document.getElementById('success-text').innerText = 'Item was updated!';
            document.getElementById('add-success').classList.add('success-modal-vis');
            edit_elem.click();

            if(document.getElementById("collapse1").children[0].src == ip+"pics/up.png"){
                await showReport("collapse1");
                await showReport("collapse1");
            }
            if(document.getElementById("collapse2").children[0].src == ip+"pics/up.png"){
                await showReport("collapse2");
                await showReport("collapse2");
            }
            if(document.getElementById("collapse3").children[0].src == ip+"pics/up.png"){
                await showReport("collapse3");
                await showReport("collapse3");
            }
            if(document.getElementById("collapse4").children[0].src == ip+"pics/up.png"){
                await showReport("collapse4");
                await showReport("collapse4");
            }
            if(document.getElementById("collapse5").children[0].src == ip+"pics/up.png"){
                await showReport("collapse5");
                await showReport("collapse5");
            }
                setTimeout(() => {
                document.getElementById('add-success').classList.remove('success-modal-vis');
                }, 2000);

            // edit done
            edit_mode = false;
        }
      }


      modal_form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendItemData();
      });

      remove_elem.onclick = async () => {
        if((remove_elem.innerText == 'Remove item') && (open_elem.innerText == 'Close') && !(items2[0] == undefined || items2[0] == null) && (edit_elem.innerText == 'Edit item')){           
            remove_elem.innerText = 'Cancel';
            for(i = 1; i <= 12; i++){
                if(!(items_elem.children[i-1].children[0].src.includes("biink.png"))){
                    document.getElementById('remove-icon' + i).innerHTML = "X";
                    document.getElementById('remove-icon' + i).style.display = 'inline';
                    items_elem.children[i-1].style.backgroundColor = 'transparent';
                }
                else document.getElementById('remove-icon' + i).style.display = 'none';
            }
        } 
        else if((open_elem.innerText == 'Close') && !(items2[0] == undefined || items2[0] == null) && (edit_elem.innerText == 'Cancel'));
        else{
            remove_elem.innerText = 'Remove item';
            for(i = 1; i <= 12; i++){
                document.getElementById('remove-icon' + i).style.display = 'none'
            }
            document.getElementById('delete-modal').style.display = "none";
            let temp = page2;
            await populateFridge();
            page2 = temp;
            displayItemsPage(temp);
        } 
    }

    edit_elem.onclick = async () => {
        if((edit_elem.innerText == 'Edit item') && (open_elem.innerText == 'Close') && !(items2[0] == null || items2[0] == undefined) && (remove_elem.innerText == 'Remove item')){           
            edit_elem.innerText = 'Cancel';
            for(i = 1; i <= 12; i++){
                if(!(items_elem.children[i-1].children[0].src.includes("biink.png"))){
                    document.getElementById('remove-icon' + i).innerHTML = "<img src='pics/edit.png' style='width:10px;'>";
                    document.getElementById('remove-icon' + i).style.display = 'inline';
                    items_elem.children[i-1].style.backgroundColor = 'transparent';
                }
                else document.getElementById('remove-icon' + i).style.display = 'none';
            }
        } 
        else if((open_elem.innerText == 'Close') && !(items2[0] == undefined || items2[0] == null) && (remove_elem.innerText == 'Cancel'));
        else{
            edit_elem.innerText = 'Edit item';
            for(i = 1; i <= 12; i++){
                document.getElementById('remove-icon' + i).style.display = 'none'
            }
            document.getElementById('modal').classList.remove('modal-vis');
            let temp = page2;
            await populateFridge();
            page2 = temp;
            displayItemsPage(temp);            
            edit_mode = false;
        } 
    }

    let col3_add_elem = document.getElementById('add-button');
    let col3_view_elem = document.getElementById('view-button');
    let col3_history_elem = document.getElementById('history-button');

    col3_history_elem.onclick = async () => {
        document.getElementById('col3-home').style.display='none';
	document.getElementById('col3-history').style.display='flex';
	document.getElementById('graph').innerHTML = `
	<div class='ch'>
	<canvas id="myChart"></canvas>
	</div>
	<div class='ch'>
        <canvas id='chart2'></canvas>
	</div>
	<div class='ch'>
	<canvas id='chart3'></canvas>
        </div>
	<div class='ch'>
	<canvas id='chart4'></canvas>
	</div>`;
	await getGraph(1);
	await getGraph(2);
	await getGraph(3);
	await getGraph(4);
    }
    col3_add_elem.onclick = () => {
        document.getElementById('col3-home').style.display='none';
        document.getElementById('col3-add').style.display='flex';

    }

    col3_view_elem.onclick = () => {
        document.getElementById('col3-home').style.display='none';
        document.getElementById('col3-report').style.display='flex';
    }

    let col3_back_elem1 = document.getElementById('report-back');
    col3_back_elem1.onclick = async () => {
        for(i=1; i<=5; i++){
            if((document.getElementById("collapse"+i).children[0].src == ip+"pics/up.png")){
                await showReport("collapse"+i);
            }
          }
        document.getElementById('col3-report').style.display='none';
        document.getElementById('col3-home').style.display='flex';

    }

    let col3_back_elem2 = document.getElementById('add-back');
    col3_back_elem2.onclick = () => {
        document.getElementById('col3-add').style.display='none';
        document.getElementById('col3-home').style.display='flex';
        modal_elem.classList.remove('modal-vis');

    }

    let col3_back_elem3 = document.getElementById('history-back');
    col3_back_elem3.onclick = () => {
	document.getElementById('graph').innerHTML = '';
        document.getElementById('col3-history').style.display='none';
        document.getElementById('col3-home').style.display='flex';

    }

    let sort_form = document.getElementById("item-sort-form");
    sort_form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(sort_form);
        localStorage.setItem('sort_selection', formData.get('sort-options'))
        await setSort();
        await populateFridge();
        open_elem.click();
        open_elem.click();
    });

    let clear_elem = document.getElementById("clear-button");
    clear_elem.onclick = () => {
        if(edit_elem.innerText == "Cancel" || remove_elem.innerText == "Cancel") return;

        ((document.getElementById("clear-modal").style.display == "none") || (document.getElementById("clear-modal").style.display == ""))?
            document.getElementById("clear-modal").style.display = "flex": 
            document.getElementById("clear-modal").style.display = "none";

        clear_elem.innerHTML == "Clear items"?
            clear_elem.innerHTML = "Cancel": 
            clear_elem.innerHTML = "Clear items";
    }

    let clear_form = document.getElementById("clr-form");
    clear_form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if(document.getElementById("exp-clr").checked || document.getElementById("all-clr").checked || document.getElementById("out-clr").checked){
        const formData = new FormData(clear_form);

            if(document.getElementById("all-clr").checked){
                const {data, error} = await client.from('user_items').select('log_id, id, item_id, expiry_date, log_date').eq('id', uid)
                for (log of data){
                    const {error} = await client.from('user_history').insert({
                        log_id: log.log_id,
                        user_id: uid,
                        item_id: log.item_id,
                        expiry_date: log.expiry_date,
                        log_date: log.log_date,
                        date_removed: new Date().toISOString().split('T')[0]
                    })

                    await client.from('user_items').delete().eq('log_id', log.log_id)
                }
            }
            else{
                if (document.getElementById("exp-clr").checked){
                    const today = new Date().toISOString().split('T')[0]
                    const {data, error} = await client.from('user_items').select('log_id, id, item_id, expiry_date, log_date').eq('id', uid).lt('expiry_date', today)
                    for (log of data){
                        const {error} = await client.from('user_history').insert({
                            log_id: log.log_id,
                            user_id: uid,
                            item_id: log.item_id,
                            expiry_date: log.expiry_date,
                            log_date: log.log_date,
                            date_removed: new Date().toISOString().split('T')[0]
                        })

                        await client.from('user_items').delete().eq('log_id', log.log_id)
                    }
                }
                if(document.getElementById("out-clr").checked){
                    const {data, error} = await client.from('user_items').select('log_id, id, item_id, expiry_date, log_date').eq('id', uid).eq('quantity', 0)
                    for (log of data){
                        const {error} = await client.from('user_history').insert({
                            log_id: log.log_id,
                            user_id: uid,
                            item_id: log.item_id,
                            expiry_date: log.expiry_date,
                            log_date: log.log_date,
                            date_removed: new Date().toISOString().split('T')[0]
                        })

                        await client.from('user_items').delete().eq('log_id', log.log_id)
                    }
                }
            }

            await populateFridge();
            displayItemsPage(page2);
            clear_elem.click();

            if(document.getElementById("collapse1").children[0].src == ip+"pics/up.png"){
                await showReport("collapse1");
                await showReport("collapse1");
            }
            if(document.getElementById("collapse2").children[0].src == ip+"pics/up.png"){
                await showReport("collapse2");
                await showReport("collapse2");
            }
            if(document.getElementById("collapse3").children[0].src == ip+"pics/up.png"){
                await showReport("collapse3");
                await showReport("collapse3");
            }
            if(document.getElementById("collapse4").children[0].src == ip+"pics/up.png"){
                await showReport("collapse4");
                await showReport("collapse4");
            }
            if(document.getElementById("collapse5").children[0].src == ip+"pics/up.png"){
                await showReport("collapse5");
                await showReport("collapse5");
            }

        }
        else {
            clear_elem.click();
        }
    });    

    window.addEventListener("resize", () => positionFridge());

    function positionFridge(){
        let width = window.innerWidth;
        let closed_div = document.querySelector(".col2-closed");
        let open_div = document.querySelector(".col2-open");
        let hover_div = document.getElementById('item-info');
        let item_pix_str = "35%";
        let pag_pix = 0;
        let pix = 0;
        let hover_pix = 0;
        if(window.innerWidth <= 840){
            item_pix_str = "365px";
            pag_pix = 147;
            hover_pix = 304;
            if(open_elem.innerText == "Open") closed_div.style.backgroundPosition = pix+"px";
            else open_div.style.backgroundPosition = pix+"px";
            items_elem.style.left = item_pix_str;
            fridge_pag_elem.style.left = pag_pix+"px";
            hover_div.style.right = hover_pix+"px";
        }
        else if(window.innerWidth <= 1340){
            if(open_elem.innerText == "Open") closed_div.style.backgroundPosition = pix+"px";
            else open_div.style.backgroundPosition = pix+"px";
            item_pix = (-1/10)*(width) + 464;
            pag_pix = (-4/13)*(width) + 442;
            hover_pix = (273/440)*(width) - 296;
            item_pix_str = item_pix+"px";
            items_elem.style.left = item_pix_str;
            fridge_pag_elem.style.left = pag_pix+"px";
            hover_div.style.right = hover_pix+"px";
        }
        else{
            pix = (13/40)*(width) - 465;
            if(open_elem.innerText == "Open") closed_div.style.backgroundPosition = pix+"px";
            else open_div.style.backgroundPosition = pix+"px";
            items_elem.style.left = "35%";
            fridge_pag_elem.style.left = "0px";
            hover_div.style.right = hover_pix+"px";

        }
    }


} // end of window

async function getGraph(id){
    let initArr = [0,0,0,0,0,0,0,0,0,0,0,0];
	switch(id){
		case 1:{
            const {data, error} = await client.rpc('get_expired_by_month', {user_id: uid})
                		
			for(i=0; i<data.length; i++){
				initArr[(data[i].m-1)] = data[i].total;
			}
				
            const ctx1 = document.getElementById('myChart');

            new Chart(ctx1, {
              type: 'line',
              data: {
                labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
                datasets: [{
                  label: '# ITEMS EXPIRED',
                  data: initArr,
	          backgroundColor: ['rgba(255, 99, 132, 0.8)'],
	          borderColor: ['rgba(255, 99, 132, 0.8)'],
                  borderWidth: 1
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });

			break;
		}
	    case 2:{
            const {data, error} = await client.rpc('get_used_by_month', { user_id: uid })
            for(i=0; i<data.length; i++){
                initArr[(data[i].m-1)] = data[i].q;
            }
            const ctx2 = document.getElementById('chart2');
            new Chart(ctx2, {
              type: 'line',
              data: {
                labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
                datasets: [{
                  label: '# ITEMS USED BEFORE EXPIRY',
                  data: initArr,
                  backgroundColor: ['rgba(255, 99, 132, 0.8)'],
                  borderColor: ['rgba(255, 99, 132, 0.8)'],
                  borderWidth: 1
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
            break;
	    }
		case 3:{
            const {data, error} = await client.rpc('get_most_logged_items', {user_id: uid})
		    let labels = [];
		    let count = [];
		    for(i=0; i<Math.min(data.length, 10); i++){
		    	labels.push(data[i].name.toUpperCase());
		    	count.push(data[i].q);
		    }
	        const ctx3 = document.getElementById('chart3');

            new Chart(ctx3, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: '# TIMES LOGGED THIS YR',
                  data: count,
                  backgroundColor: ['rgba(255, 99, 132, 0.8)'],
                  borderColor: ['rgba(255, 99, 132, 0.8)'],
                  borderWidth: 1
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
			break;
		}
		case 4:{
            const {data, error} = await client.rpc('get_most_wasted_items', {user_id: uid})
            let labels = [];
            let count = [];
            for(i=0; i<Math.min(data.length, 10); i++){
                    labels.push(data[i].name.toUpperCase());
                    count.push(data[i].q);
            }
            
            const ctx4 = document.getElementById('chart4');

            new Chart(ctx4, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: '# TIMES EXPIRED THIS YR',
                  data: count,
                  backgroundColor: ['rgba(255, 99, 132, 0.8)'],
                  borderColor: ['rgba(255, 99, 132, 0.8)'],
                  borderWidth: 1
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
			break;
		}
	}
}

async function populateSearch(str){
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

        const { data, error } = await client
          .from('items')
          .select('pic_file, name')

        const sorted = data.sort((a, b) => {
          const aMatch = a.name.toLowerCase().includes(str.toLowerCase())
          const bMatch = b.name.toLowerCase().includes(str.toLowerCase())
          return bMatch - aMatch
        })

        page1 = 1;
        items1 = sorted;

        document.getElementById('num-res').innerText = 9*(page1-1)+1 + "-" + Math.min(sorted.length, 9*page1) + " of " + sorted.length + " results ";
        document.getElementById('pag-arrows').style.visibility = 'visible';
        for(i = 0; i < 9; i++){
            if(sorted[i] != null){
                document.getElementById('disp'+(i+1)).src = 'pics/items/' + sorted[i].pic_file;
            }
            else document.getElementById('disp'+(i+1)).src = 'pics/biink.png';
        }
    }
}


function displayItemsPage(page){
    let items_elem = document.getElementById('fridge-grid');
    let remove_elem = document.getElementById('remove-button');
    let edit_elem = document.getElementById('edit-button');
    let open_elem = document.getElementById('open-button');

    if((page==1) || (open_elem.innerText == 'Open')) document.getElementById('fridge-pag1').style.visibility = 'hidden';
    else document.getElementById('fridge-pag1').style.visibility = 'visible';

    if(items2[(12*(page-1))] == undefined || items2[(12*(page-1))] == null){
        page2--;
    } 

    if(items2[0] == undefined || items2[0] == null){
        document.getElementById('fridge-pag1').style.visibility = 'hidden';
        for(i = 0; i < 12; i++){
            items_elem.children[i].children[0].src = 'pics/biink.png';
            items_elem.children[i].id = 'empty';
            items_elem.children[i].style.backgroundColor = 'transparent';
            items_elem.children[i].children[0].style.opacity = '1';
            items_elem.children[i].children[2].innerText = "";
        }
    }

    else{
        for(i = 0; i < 12; i++){
            let next_item = items2[((12*(page-1)+i))];
            if(next_item != undefined && next_item != null){
                items_elem.children[i].children[0].src = 'pics/items/' + next_item.items.pic_file;
                items_elem.children[i].id = next_item.log_id;
                let exp_date = new Date(next_item.expiry_date + "T00:00:00");
                let cur_date = new Date(Date.now());
                cur_date.setMilliseconds(0);
                cur_date.setSeconds(0);
                cur_date.setMinutes(0);
                cur_date.setHours(0);
                if(next_item.quantity == 0){
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

        if((items2[((12*(page)))] == undefined) || (items2[((12*(page)))] == null) || (open_elem.innerText == 'Open')) document.getElementById('fridge-pag2').style.visibility = 'hidden';
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
                        document.getElementById('disp'+(i+1)).src = 'pics/items/' + items1[i + ((page1-1)*9)].pic_file;
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
                    document.getElementById('disp'+(i+1)).src = 'pics/items/' + items1[i + ((page1-1)*9)].pic_file;
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

async function itemAdd(id){
    console.log(id)
    if(document.getElementById(id).children[0].src != ip + "pics/biink.png"){
        modal_elem = document.getElementById('modal');
        document.getElementById('modal-pic').src = document.getElementById(id).childNodes[0].src;
        modal_elem.classList.add('modal-vis');
        file_name = document.getElementById('modal-pic').src.substr(ip.length+14);
        const { data, error } = await client.from('items')
        .select('name, id, fridge_days')
        .eq('pic_file', file_name)
        .single()
        console.log(error)
        console.log(file_name)

        const today = new Date()
        today.setDate(today.getDate() + data.fridge_days)
        const expiryDate = today.toISOString().split('T')[0] // formats as YYYY-MM-DD

        document.getElementById('modal_name').value = data.name;
        document.getElementById('modal_id').value = data.id;
        document.getElementById('modal_exp_date').value = expiryDate;
        document.getElementById('modal_fresh').value = 10;
        dispFresh('modal_fresh');
        document.getElementById('submit-for-add').style.display = 'inline';
        document.getElementById('submit-for-edit').style.display = 'none';
        document.getElementById('modal-out').style.display = 'none';
    }

}


async function dispName(id){     // in the item add section
    if (document.getElementById(id).childNodes[0].src != ip + "pics/biink.png"){
        file_name = document.getElementById(id).childNodes[0].src.substr(ip.length+11);
        const { data, error } = await client.from('items').select('name').eq('pic_file', file_name)
        document.getElementById('item-name').style.visibility = 'visible';
        document.getElementById('item-name').innerText = data[0].name;
    }
     
}

async function displayItemInfo(log_id){
    let log_elem = document.getElementById('item-info');

    if((log_id == 'empty'));
    else{
        const { data, error } = await client
          .from('user_items')
          .select(`
            quantity,
            manufacture_date,
            expiry_date,
            log_date,
            freshness,
            mod_date,
            items(name, fridge_days)
          `)
          .eq('log_id', log_id)
          .single()

        // calculate freshness client side
        const today = new Date()
        const modDate = new Date(data.mod_date)
        const diffDays = Math.floor((today - modDate) / (1000 * 60 * 60 * 24))
        const freshness = Math.max(0, data.freshness - (diffDays / (data.items.fridge_days / 10)))

        log_elem.style.display = 'flex';

        document.getElementById('iname').innerText = data.items.name;
        if(data.quantity == null) document.getElementById('iquantity').innerText = "N/A";
        else document.getElementById('iquantity').innerText = data.quantity;         
        
        document.getElementById('ilog').innerText = data.log_date;
        if(data.manufacture_date == null) document.getElementById('imade').innerText = "N/A";
        else document.getElementById('imade').innerText = data.manufacture_date;
        let exp_date = new Date(data.expiry_date + "T00:00:00");
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
            else if(Math.round((exp_date.valueOf() - cur_date.valueOf()) / (24*60*60*1000)) == 1) document.getElementById('ilife').innerText = "1 day"; 
            else document.getElementById('ilife').innerText = Math.round(((exp_date.valueOf() - cur_date.valueOf())) / (24*60*60*1000)) + " days";
            document.getElementById('ilife').style.color = 'rgb(89,89,89)';
        }
        document.getElementById('iexp').innerText = data.expiry_date;
    }
}

async function confirmRemoval(grid_id){   
    //this method will be used for edit as well

    if(document.getElementById(grid_id).innerHTML == "X"){
        let log_id = document.getElementById(grid_id).parentElement.id;
        id_to_delete = log_id;
        let delete_elem = document.getElementById('delete-modal');
        document.getElementById('delete-pic').src = document.getElementById(grid_id).parentElement.children[0].src;
        delete_elem.style.display = 'flex';

        const {data, error} = await client.from('user_items').select('log_id, items(name)')
            .eq('log_id', id_to_delete)
            .single()
        if(error) console.log(error)
        document.getElementById('delete-name').innerText = data.items.name;
    }
    else{
        edit_mode = true;
        let log_id = document.getElementById(grid_id).parentElement.id;

        modal_elem = document.getElementById('modal');
        modal_elem.classList.add('modal-vis');
        document.getElementById('modal-pic').src = document.getElementById(grid_id).parentElement.children[0].src;
        document.getElementById('submit-for-add').style.display = 'none';
        document.getElementById('submit-for-edit').style.display = 'inline';
        document.getElementById('modal-out').style.display = 'inline';

        const {data, error} = await client.from('user_items').select(`
            quantity,
            manufacture_date,
            expiry_date,
            log_date,
            freshness,
            mod_date,
            items(name, fridge_days)
            `)
            .eq('log_id', log_id)
            .single()
            document.getElementById('modal_name').value = data.items.name;
            document.getElementById('modal_log_id').value = log_id;
            document.getElementById('modal_quantity').value = data.quantity;
            document.getElementById('modal_man_date').value = data.manufacture_date;
            document.getElementById('modal_exp_date').value = data.expiry_date;

            curr = new Date()
            mod = new Date(data.mod_date)
            diff = Math.floor((curr - mod)/(1000 * 60 * 60 * 24))
            fresh_val = Math.max(0, data.freshness - (diff/(data.items.fridge_days/10)))

            document.getElementById('modal_fresh').value = fresh_val;
            document.getElementById('tt1').innerText = Math.round(fresh_val);
            dispFresh("modal_fresh");

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
            const {data} = await client.from('user_items').select('item_id, expiry_date, log_date').eq('log_id', id_to_delete).single()
            await client.from('user_history').insert({
                log_id: id_to_delete,
                user_id: uid,
                item_id: data.item_id,
                expiry_date: data.expiry_date,
                log_date: data.log_date,
                date_removed: new Date().toISOString().split('T')[0]
            })

            const {error} = await client.from('user_items').delete().eq('log_id', id_to_delete)

            if(!error){
                delete_elem.style.display = 'none';
                await populateFridgeGlobal();
                displayItemsPage(page2);   

                if(document.getElementById("collapse1").children[0].src == ip + "pics/up.png"){
                    await showReport("collapse1");
                    await showReport("collapse1");
                }

                if(document.getElementById("collapse2").children[0].src == ip + "pics/up.png"){
                    await showReport("collapse2");
                    await showReport("collapse2");
                }

                if(document.getElementById("collapse3").children[0].src == ip + "pics/up.png"){
                    await showReport("collapse3");
                    await showReport("collapse3");
                }

                if(document.getElementById("collapse4").children[0].src == ip + "pics/up.png"){
                    await showReport("collapse4");
                    await showReport("collapse4");
                }

                if(document.getElementById("collapse5").children[0].src == ip + "pics/up.png"){
                    await showReport("collapse5");
                    await showReport("collapse5");
                }
            }
        }
    }
}

async function getReportInfo(reportID){
    switch(reportID){
        case "collapse1":{
            const today = new Date().toISOString().split('T')[0]
            const threeDaysFromNow = new Date()
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
            const threeDays = threeDaysFromNow.toISOString().split('T')[0]

            const { data, error } = await client
            .from('user_items')
            .select(`
              log_id,
              expiry_date,
              items(name)
            `)
            .eq('id', uid)
            .gte('expiry_date', today)
            .lt('expiry_date', threeDays)
            .or('quantity.is.null,quantity.gt.0')
            .order('items(name)', { ascending: true })
            
            reportArr = data;
            return data;
        }
        case "collapse2":{
            const {data, error} = await client.
            from('user_items').
            select(`
             log_id,
             expiry_date,
             items(name)
                `)
            .eq('id', uid)
            .lt('expiry_date', new Date().toISOString().split('T')[0])
            .or('quantity.is.null,quantity.gt.0')
            .order('items(name)', {ascending: true})

            reportArr = data;
            return data;
        }
        case "collapse4":{
            const {data, error} = await client.from('user_items').select('log_id, items(name)')
            .eq('id', uid)
            .eq('log_date', new Date().toISOString().split('T')[0])
            .order('items(name)', {ascending: true})

            reportArr = data;
            return data;
        }
        case "collapse5":{
            const {data, error} = await client.from('user_items')
            .select('log_id, items(name)')
            .eq('id', uid)
            .eq('quantity', 0)
            .order('items(name)', {ascending: true})

            reportArr = data;
            return data;
        }
    }
}

async function showReport(reportID){
    report_elem = document.getElementById(reportID+"-report");
    arrow_elem = document.getElementById(reportID).children[0];
    list_elem = report_elem.children[0]

    if(report_elem.style.display == 'none' || report_elem.style.display == ''){
        report_elem.style.display = 'inline';
        arrow_elem.src = 'pics/up.png';
    }
    else{
        report_elem.style.display = 'none';
        arrow_elem.src = 'pics/down.png';
        return;
    }
            switch(reportID){
                case "collapse1":
                case "collapse2":
                case "collapse4": // idk man
                case "collapse5":
                try{
                let arr = await getReportInfo(reportID);
                list_elem.innerHTML = '';
                let last_item = '';
                let item_count = 1;

                    for(i=0; i<arr.length; i++){
                        restock_item = document.createElement("li");
        
                        node = document.createTextNode(arr[i].items.name);
                        restock_item.appendChild(node);
                        restock_item.style.marginBottom = "5px";
        
        
                        if(last_item == arr[i].items.name){
                            hidden_entry = document.createElement("li");
                            item_txt = document.createTextNode(arr[i].items.name);
                            hidden_entry.id = arr[i].log_id;
                            hidden_entry.appendChild(item_txt);

                            if(reportID == "collapse2"){
                                const diff = Math.floor((new Date() - new Date(arr[i].expiry_date)) / (1000 * 60 * 60 * 24))
                                days_node = document.createElement("span").appendChild(document.createTextNode(" ["+diff+" day(s) ago]"));
                            } 
                            else if(reportID == "collapse1"){
                                const diff = Math.floor((new Date(arr[i].expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                                days_node = document.createElement("span").appendChild(document.createTextNode(" ["+diff+" day(s) left]"));
                            }
                            else if(reportID == "collapse4" || reportID == "collapse5"){
                                days_node = document.createElement("span").appendChild(document.createTextNode(""));
                            }
                            hidden_entry.appendChild(days_node);
                            hidden_entry.style.marginBottom = "5px";
                            test1.appendChild(hidden_entry);
        
                            if(i==arr.length-1){
                                days_node = document.createElement("span").appendChild(document.createTextNode(" (" + (++item_count) +")"));
                                test1.previousElementSibling.appendChild(days_node);
                                addListView(test1.previousElementSibling, i-item_count+1, item_count);
                            }
                            item_count ++;
        
                        }
                        else{
                            if(i != 0){
                                days_node = document.createElement("span").appendChild(document.createTextNode(" (" + item_count +")"));
                                test1.previousElementSibling.appendChild(days_node);
                                addListView(test1.previousElementSibling, i-item_count, item_count);
                            }
        
                                list_elem.appendChild(restock_item);
        
                                test1 = document.createElement("ul");
        
                                restock_item.id = arr[i].log_id;
                                test1.id = "start-"+arr[i].log_id;
                                test1.style.display = "none";
        
                                list_elem.appendChild(test1);
        
        
                                if(i == arr.length-1){
                                    days_node = document.createElement("span").appendChild(document.createTextNode(" (1)"));
                                    restock_item.appendChild(days_node);
                                    addListView(restock_item, i, 1);
                                }
                                
                                item_count = 1;
        
                        }
                        
                        last_item = arr[i].items.name;
        
                    }
                    }catch{
                        console.error(e);
                    }
                    break;
                    case "collapse3": {
                        list_elem.innerHTML = '';
                        await getRecipes();
                        if(recipeLinks.length == 0){
                            link_node = document.createElement("li");
                            link_node.appendChild(document.createTextNode("Log more items for some inspo!"))
                            link_node.style.fontSize = "17px";
                            list_elem.appendChild(link_node);
                        }
                        else{
                            list_elem.innerHTML = '';
                            for(i=0; i<recipeNames.length; i++){
                                link_node = document.createElement("li");
                                node = document.createElement('a');
                                node1 = document.createTextNode(recipeNames[i]);
                                node.style.fontSize = "17px";
                                node.appendChild(node1);
                                node.href = recipeLinks[i];
                                node.target = "_blank";
                                link_node.appendChild(node);
                                list_elem.appendChild(link_node);
                            }
                        }
                    }
                    break;
                        
            }

}


function addListView(start_elem, arrIndex, item_count){
    let index = 0;
    let box = 0;
    
    start_elem.onclick = async () => {

        if(!(start_elem.parentElement.id.substr(0,6) == "start-")){ // days_past and item_count will only be used in this block
                click_id = start_elem.parentElement.parentElement.previousElementSibling.id;
                await getReportInfo(click_id);

                if(start_elem.nextElementSibling.style.display == "block"){
                    start_elem.nextElementSibling.style.display = "none";
                    start_elem.innerText = reportArr[arrIndex].items.name + " (" + item_count + ")";

                }
                else{
                    start_elem.nextElementSibling.style.display = "block";
                    if(click_id == "collapse1"){
                        const diff = Math.floor((new Date(reportArr[arrIndex].expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                        start_elem.innerText = reportArr[arrIndex].items.name +  " ["+diff+" day(s) left]";
                    }
                    else if(click_id == "collapse2"){
                        const diff = Math.floor((new Date() - new Date(reportArr[arrIndex].expiry_date)) / (1000 * 60 * 60 * 24))
                        start_elem.innerText = reportArr[arrIndex].items.name +  " ["+diff+" day(s) ago]";
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

        for(i=0; i<items2.length; i++){
            if(items2[i].log_id == start_elem.id){
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
    let ingStr = "";
    const regex = / /gi;
    let dbCall = false;

    const {data, error} = await client.rpc('get_quantity_by_item', {user_id: uid})

     if(data.length != 0){
         let numIng = Math.min(data.length, 3);
         ingList = [];
         // this part generates the new ing list
         for(i=0; i<data.length; i++){
             if(ingList.length < numIng){
                 if((data[i].total != 0) && (ingList.indexOf(data[i].name.replaceAll(regex, '%20')) == -1)) ingList.push(data[i].name.replaceAll(regex, '%20'));
                 // if item quantity is not zero, and if its not alr in the list
             }
             else break;
         }
         // this part decides if a new db call needs to be made (i.e. are current ing identical to ones before)
         if(prevIngList.length == ingList.length){
             for(i=0; i<prevIngList; i++){
                 if(ingList.indexOf(prevIngList[i]) == -1){
                     dbCall = true;
                     break;  // if theres something that wasnt there before, make another call
                 }
                 // if this break condition is never met, means everything is mapped to everything, so no call required (db call stays false)
             }
         }
         else dbCall = true;  // will reach here if the lists arent the same
         
         prevIngList = ingList;
         recipeLinks = prevRecipeLinks;
         recipeNames = prevRecipeNames;
         if(dbCall){
             recipeLinks = [];
             recipeNames = [];
             for(i=0; i<ingList.length; i++){
                 (i==(ingList.length-1))? (ingStr += ingList[i]): (ingStr += ingList[i]+"%20");
             }
             try {
                const response = await fetch(
                  "https://api.edamam.com/api/recipes/v2?type=public&q=" + ingStr + 
                  "&app_id=8e916fbf&app_key=54e58531e8759ea50137708128da43e3" +
                  "&ingr=10" +
                  "&health=alcohol-free&health=pork-free&health=shellfish-free" +
                  "&dishType=biscuits and cookies" +
                  "&dishType=bread" +
                  "&dishType=cereals" +
                  "&dishType=desserts" +
                  "&dishType=main course" +
                  "&dishType=pancake" +
                  "&dishType=preps" +
                  "&dishType=salad" +
                  "&dishType=sandwiches" +
                  "&dishType=side dish" +
                  "&dishType=soup" +
                  "&dishType=starter" +
                  "&dishType=sweets", {
                    method: "GET"
                  }
                );

                   let result = await response.json();
                   // additional filters that kept slipping thru
                   if(result.hits.length != 0){
                     for(i=0; i<result.hits.length; i++){
                         let testName = result.hits[i].recipe.label.toLowerCase();
                         if(testName.includes("pork") || testName.includes("bacon") || testName.includes("loin") || testName.includes("gelatin") || testName.includes("ham") || testName.includes("wine") || testName.includes("gin") || testName.includes("amaretto") || testName.includes("pig") || testName.includes("cider") || testName.includes("bourbon"));
                         else if (testName == "carrot, apple, and hummus wrap"); // instructions link does not match
		    else if (testName == "apple bread pudding");
                         else{
                             for(j=0; j<result.hits[i].recipe.ingredientLines.length; j++){
                                 let testIng = result.hits[i].recipe.ingredientLines[j].toLowerCase();
                                 if(testIng.includes("pork") || testIng.includes("bacon") || testIng.includes("loin") || testIng.includes("gelatin") || testIng.includes("ham") || testIng.includes("wine") || testIng.includes("gin") || testIng.includes("amaretto") || testIng.includes("pig") || testIng.includes("cider") || testName.includes("bourbon")) break;
                                 else{
                                     if(j==result.hits[i].recipe.ingredientLines.length-1){
                                         recipeLinks.push(result.hits[i].recipe.url);
                                         recipeNames.push(result.hits[i].recipe.label);
                                     }
                                 }
                             }
                         }
                     }
                   }
                   prevRecipeLinks = recipeLinks;
                   prevRecipeNames = recipeNames;
             } catch {
                 console.error(e);

             }
         }
     }
     else{
         recipeLinks = [];
         recipeNames = [];
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

async function logout(){
    localStorage.removeItem('sort_selection')
    const { error } = await client.auth.signOut()
    if (error) console.error(error)
    window.location.href = 'login.html'
}