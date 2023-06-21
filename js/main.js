let eventBus = new Vue();

Vue.component('container', {
    data() {
        return {
            columns: [
                [],
                [],
                [],
                [],
            ],
            isEdit: false,
            isReason: false,
        }
    },
    template: `
<div>
    <create-card v-if="!isEdit && !isReason"></create-card>
    <edit v-if="isEdit"></edit>
    <reason v-if="isReason"></reason>
    <div class="container">
        <planned class="column" :columns="columns" :column="columns[0]" :idColumn="0" data-column="0" v-if="!isEdit && !isReason"></planned>
        <working class="column" :columns="columns" :column="columns[1]" :idColumn="1" data-column="1" v-if="!isEdit && !isReason"></working>
        <testing class="column" :columns="columns" :column="columns[2]" :idColumn="2" data-column="2" v-if="!isEdit && !isReason"></testing>     
        <completed class="column" :column="columns[3]" :idColumn="3" data-column="3" v-if="!isEdit && !isReason"></completed>            
    </div>
</div>
    `,
    mounted() {
        if (localStorage.columns) {
            this.columns = JSON.parse(localStorage.columns);
        }
        eventBus.$on('card-submitted', createdCard => {
            this.columns[0].push(createdCard);
            this.save();
        })
        eventBus.$on('del-card', (idCard, idColumn) => {
            this.columns[idColumn].splice(idCard, 1);
            this.save();
        })
        eventBus.$on('edit-card', (idCard, idColumn) => {
            this.isEdit = true;
            eventBus.$on('edit-submitted', editCard => {
                if (editCard.title) this.columns[idColumn][idCard].title = editCard.title;
                if (editCard.description) this.columns[idColumn][idCard].description = editCard.description;
                if (editCard.deadlineTime) this.columns[idColumn][idCard].deadlineTime = editCard.deadlineTime;
                if (editCard.deadlineDate) this.columns[idColumn][idCard].deadlineDate = editCard.deadlineDate;
                if (editCard.editTime) this.columns[idColumn][idCard].editTime = editCard.editTime;
                if (editCard.editDate) this.columns[idColumn][idCard].editDate = editCard.editDate;
                this.isEdit = false;
                this.save();
            })
        })
        eventBus.$on('next-column', (idCard, idColumn) => {
            this.columns[idColumn + 1].push(this.columns[idColumn][idCard]);
            this.columns[idColumn].splice(idCard, 1);
            this.save();
        })
        eventBus.$on('previous-column', (idCard, idColumn) => {
            this.isReason = true;
            eventBus.$on('reason-submitted', reason => {
                this.columns[idColumn][idCard].reason = reason.reason;
                this.columns[idColumn - 1].unshift(this.columns[idColumn][idCard]);
                this.columns[idColumn].splice(idCard, 1);
                this.isReason = false;
                this.save();
            });
        })


        const container = document.querySelector(".container");
        let idCard;
        let idColumn;
        container.addEventListener("dragstart", (e) => {
            if (e.target.classList.contains("card")) {
                idCard = e.target.dataset.id;
                idColumn = Number(e.target.dataset.column);
            }
        });
        let targetColumn;
        container.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
        container.addEventListener("drop", (e) => {
            targetColumn = e.target;
            while (!targetColumn.classList.contains("column")) {
                targetColumn = targetColumn.parentElement;
            }
            if (Number(targetColumn.dataset.column) === idColumn + 1) {
                this.nextColumnLast(idCard, idColumn)
                this.nextColumn(idCard, idColumn)
            }
            if (Number(targetColumn.dataset.column) === idColumn - 1 && idColumn === 2) {
                this.previousColumn(idCard, idColumn)
            }
            this.save();
        })

    },
    methods: {
        save() {
            localStorage.columns = JSON.stringify(this.columns);
        },
        nextColumn(idCard, idColumn) {
            eventBus.$emit('next-column', idCard, idColumn)
        },
        nextColumnLast(idCard, idColumn) {
            eventBus.$emit('next-column-last', idCard, idColumn)
        },
        previousColumn(idCard, idColumn) {
            eventBus.$emit('previous-column', idCard, idColumn)
        },
    }
})

Vue.component('planned', {
    props: {
        columns: {
            type: Array,
            required: true
        },
        column: {
            type: Array,
            required: true
        },
        idColumn: {
            type: Number,
            required: true
        },
    },
    mounted() {
    },
    methods: {},
    template: `
<div>
    <div>
        <card v-for="(card, idCard) in column" :key="idCard" :idCard="idCard" :card="card" :idColumn="idColumn" class="card" ></card>
    </div>
</div>
    `
})

Vue.component('working', {
    props: {
        columns: {
            type: Array,
            required: true
        },
        column: {
            type: Array,
            required: true
        },
        idColumn: {
            type: Number,
            required: true
        },
    },
    mounted() {

    },
    methods: {},
    template: `
<div>
    <div >
        <card v-for="(card, idCard) in column" :key="idCard" :idCard="idCard" :card="card" :idColumn="idColumn" class="card" ></card>
    </div>
</div>
    `
})

Vue.component('testing', {
    props: {
        columns: {
            type: Array,
            required: true
        },
        column: {
            type: Array,
            required: true
        },
        idColumn: {
            type: Number,
            required: true
        },
    },
    mounted() {
        eventBus.$on('next-column-last', (idCard, idColumn) => {
            if (idColumn === 2) {
                this.column[idCard].inTime = this.completedDate(idCard);
            }
        })
    },
    methods: {
        completedDate(idCard) {
            let Data = new Date();
            let date = this.column[idCard].deadlineDate.split('-');
            let time = this.column[idCard].deadlineTime.split(':');

            if (Data.getFullYear() > Number(date[0])) return false;
            if (Data.getFullYear() < Number(date[0])) return true;

            if (Number(Data.getMonth() + 1) > Number(date[1])) return false;
            if (Number(Data.getMonth() + 1) < Number(date[1])) return true;

            if (Number(Data.getDate()) > Number(date[2])) return false;
            if (Number(Data.getDate()) < Number(date[2])) return true;

            if (Number(Data.getHours()) > Number(time[0])) return false;
            if (Number(Data.getHours()) < Number(time[0])) return true;

            if (Number(Data.getMinutes()) > Number(time[1])) return false;
            if (Number(Data.getMinutes()) <= Number(time[1])) return true;
        }
    },
    template: `
<div>
    <div>
        <card v-for="(card, idCard) in column" :key="idCard" :idCard="idCard" :card="card" :idColumn="idColumn" class="card" ></card>
    </div>
</div>
    `
})

Vue.component('completed', {
    props: {
        column: {
            type: Array,
            required: true
        },
        idColumn: {
            type: Number,
            required: true
        },
    },
    methods: {},
    template: `
<div>
    <div>
        <card v-for="(card, idCard) in column" :key="idCard" :idCard="idCard" :card="card" :idColumn="idColumn" class="card" ></card>
    </div>
</div>
    `
})


Vue.component('card', {
    props: {
        card: {
            type: Object,
            required: true
        },
        idColumn: {
            type: Number,
            required: true
        },
        idCard: {
            type: Number,
            required: true
        }
    },
    methods: {
        delCard(idCard, idColumn) {
            eventBus.$emit('del-card', idCard, idColumn);
        },
        editCard(idCard, idColumn) {
            eventBus.$emit('edit-card', idCard, idColumn)
        },
        previousColumn(idCard, idColumn) {
            eventBus.$emit('previous-column', idCard, idColumn)
        },
        nextColumn(idCard, idColumn) {
            eventBus.$emit('next-column', idCard, idColumn)
        },
        nextColumnLast(idCard, idColumn) {
            eventBus.$emit('next-column-last', idCard, idColumn)
        }
    },
    template: `
<div :key="idCard" :class="{in_time: card.inTime, not_in_time: card.inTime == false}" draggable="true" :data-id="idCard" :data-column="idColumn">
        <div class="in-card">
            <h2 class="card_title">{{card.title}}</h2>
            <button v-if="idColumn === 0" @click="delCard(idCard, idColumn)">delete</button>
            <button v-if="idColumn !== 3" @click="editCard(idCard, idColumn)">edit</button>
        </div>
        <div class="in-card"> 
            <p>description:</p>
            <p>{{card.description}}</p> 
        </div>
        <div class="in-card">
            <p>created:</p>
            <p class="card_time">{{card.time}}</p>
            <p class="card_date">{{card.date}}</p>
        </div>
        <div v-if="card.editTime" class="in-card">
            <p>edit:</p>
            <p class="card_edit_time">{{card.editTime}}</p>
            <p class="card_edit_data">{{card.editDate}}</p>
        </div>
        <div v-if="card.reason" class="in-card">
            <p>reason:</p>
            <p class="card_reason">{{card.reason}}</p>
        </div>
        <div class="in-card">
            <p>deadline:</p>
            <p class="card_deadline_time">{{card.deadlineTime}}</p>
            <p class="card_deadline_data">{{card.deadlineDate}}</p>
        </div>
        <div v-if="idColumn !==3" class="in-card">
            <button v-if="idColumn ===2" class="left_arrow" @click="previousColumn(idCard, idColumn)">&#5130</button>
            <button class="right_arrow" @click="nextColumnLast(idCard, idColumn), nextColumn(idCard, idColumn)">&#5125</button>
        </div>
</div>
    `
})


Vue.component('reason', {
    data() {
        return {
            reason: null
        }
    },
    methods: {
        onSubmit() {
            if (this.reason) {
                let reason = {
                    reason: this.reason
                }
                eventBus.$emit('reason-submitted', reason);
            }
            this.reason = null
        }
    },
    template: `
<form class="reason-form" @submit.prevent="onSubmit">
    <h2>Reason</h2>
    <p>
        <label for="reason">Reason:</label>
        <input id="reason" v-model="reason" placeholder="reason">
    </p>
    <p>
        <input type="submit" value="Save"> 
    </p>
</form>
    `
})

Vue.component('edit', {
    data() {
        return {
            title: null,
            description: null,
            deadlineTime: null,
            deadlineDate: null,
            editTime: null,
            editDate: null,
        }
    },
    methods: {
        onSubmit() {
            if (this.title || this.description || this.deadlineTime || this.deadlineDate) {
                let Data = new Date()
                let editCard = {
                    title: this.title,
                    description: this.description,
                    deadlineTime: this.deadlineTime,
                    deadlineDate: this.deadlineDate,
                    editTime: Data.getHours() + ':' + Data.getMinutes(),
                    editDate: Data.getFullYear() + '-' + Number(Data.getMonth() + 1) + '-' + Data.getDate(),
                }
                eventBus.$emit('edit-submitted', editCard);
            } else {
                let editCard = {}
                eventBus.$emit('edit-submitted', editCard);
            }
            this.title = null;
            this.description = null;
            this.deadlineTime = null;
            this.deadlineDate = null;
            this.editTime = null;
            this.editDate = null;

        }
    },
    template: `
<form class="edit-form" @submit.prevent="onSubmit">
    <h2>Edit</h2>
    <p>
        <label for="title-edit">Title edit:</label>
        <input id="title-edit" v-model="title" placeholder="title-edit">
    </p>
    <p>
        <label for="description-edit">Description edit:</label>
        <input id="description-edit" v-model="description" placeholder="description-edit">
    </p>
    <p>
        <label for="time-edit">Time edit:</label>
        <input id="time-edit" type="time" v-model="deadlineTime" placeholder="time-edit">
    </p>
    <p>
        <label for="date-edit">Date edit:</label>
        <input id="date-edit" type="date" v-model="deadlineDate" placeholder="date-edit">
    </p>
    <p>
        <input type="submit" value="Save"> 
    </p>
</form>
    `
})

Vue.component('create-card', {

    data() {
        return {
            time: null,
            date: null,
            title: null,
            description: null,
            deadlineTime: null,
            deadlineDate: null,


        }
    },
    methods: {
        onSubmit() {
            if (this.title && this.description && this.deadlineTime && this.deadlineDate) {
                let Data = new Date()
                let createdCard = {
                    time: Data.getHours() + ':' + Data.getMinutes(),
                    date: Data.getFullYear() + '-' + Number(Data.getMonth() + 1) + '-' + Data.getDate(),
                    title: this.title,
                    description: this.description,
                    deadlineTime: this.deadlineTime,
                    deadlineDate: this.deadlineDate,
                }
                eventBus.$emit('card-submitted', createdCard);
                this.time = null
                this.date = null
                this.title = null
                this.description = null
                this.deadlineTime = null
                this.deadlineDate = null
            }
        }
    },
    template: `
<form class="created-form" @submit.prevent="onSubmit">
    <p>
        <label for="title">Title:</label>
        <input id="title" v-model="title" placeholder="title">
    </p>
    <p>
        <label for="description">Description:</label>
        <input id="description" v-model="description" placeholder="description">
    </p>
    <p>
        <label for="time">Time:</label>
        <input id="time" type="time" v-model="deadlineTime" placeholder="time">
    </p>
    <p>
        <label for="date">Date:</label>
        <input id="date" type="date" v-model="deadlineDate" placeholder="date">
    </p>
    <p>
        <input type="submit" value="Submit"> 
    </p>
</form>
    `
})


Vue.component('note', {})

let app = new Vue({
    el: '#app',
    data: {},
    computed: {},

    methods: {},
})

