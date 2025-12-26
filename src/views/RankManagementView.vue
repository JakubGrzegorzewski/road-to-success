<script setup lang="ts">
import {onMounted, Ref, ref} from 'vue'
import {Rank, RankDTO} from '../scripts/Model/Rank'
import {Requirement, RequirementDTO} from '../scripts/Model/Requirement'
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";
import {useI18n} from "vue-i18n";
import PopupComponent from "@/components/Universal/PopupComponent.vue";

const { t } = useI18n();

const emits = defineEmits<{
  (e: 'showPopup', title:string, content: string): void;
}>();

const allLocalRanks : Ref<RankDTO[]> = ref([])
const allRanks : Ref<RankDTO[]> = ref([])
const editedRank : Ref<RankDTO | null> = ref(null)

const test = ref<number>(0)

const fullName = ref('')
const shortName = ref('')
const idea = ref('')

const iconFile = ref<File | null>(null)
const documentBackgroundFile = ref<File | null>(null)
const color = ref('#000000')

const startRequirements = ref<string[]>([''])
const endRequirements = ref<string[]>([''])

const requirements = ref<{ number: string; content: string }[]>([
  { number: '', content: '' }
])

onMounted(() => {
  resetForm()
})

const message : Ref<string> = ref(null)
const action : () => void = () => {};
const id : Ref<number | null> = ref(null);

function resetForm() {
  fullName.value = ''
  shortName.value = ''
  idea.value = ''
  startRequirements.value = ['']
  endRequirements.value = ['']
  requirements.value = [{ number: '', content: '' }]
  color.value = '#000000'
  iconFile.value = null
  documentBackgroundFile.value = null
  editedRank.value = null
  Rank.getAll().then(res => { allRanks.value = res });
  allLocalRanks.value = JSON.parse(window.localStorage.getItem('Ranks') || '[]') as RankDTO[];
}

const addStartReq = () => startRequirements.value.push('')
const removeStartReq = (i: number) => startRequirements.value.splice(i, 1)

const addEndReq = () => endRequirements.value.push('')
const removeEndReq = (i: number) => endRequirements.value.splice(i, 1)

const addRequirement = () => requirements.value.push({ number: '', content: '' })
const removeRequirement = (i: number) => requirements.value.splice(i, 1)

function deleteRank() {
  console.log(id.value)
  Rank.deleteObject(id.value);
  allLocalRanks.value = JSON.parse(window.localStorage.getItem('Ranks') || '[]') as RankDTO[];
}

function editRank(id: number) {
  resetForm();
  const rankToEdit = allRanks.value.find(r => r.id === id);
  if (!rankToEdit) return;

  editedRank.value = rankToEdit;

  fullName.value = rankToEdit.fullName;
  shortName.value = rankToEdit.shortName;
  idea.value = rankToEdit.idea;
  startRequirements.value = [...rankToEdit.startRequirements];
  endRequirements.value = [...rankToEdit.endRequirements];
  color.value = rankToEdit.colorHex;


  requirements.value = []

  // Load requirements
  rankToEdit.requirementIds.forEach(reqId => {
    if (allRanks.value)
      Requirement.getById(reqId).then(e => {
        requirements.value.push({ number: e.number, content: e.content});
      });
  });
}

const generateId = (): number => Math.floor(Math.random() * 1000000000000000)

function normalizeStrings(arr: string[]) {
  return arr.map(s => s.trim()).filter(s => s.length > 0)
}

async function onSubmit() {
  const rankId = generateId()

  const rank: RankDTO = {
    id: rankId,
    fullName: fullName.value.trim(),
    shortName: shortName.value.trim(),
    idea: idea.value.trim(),
    startRequirements: normalizeStrings(startRequirements.value),
    endRequirements: normalizeStrings(endRequirements.value),
    requirementIds: [],
    ranksInProgressIds: [],
    colorHex: color.value.trim(),
    iconInBase64: await convertFileToBase64(iconFile.value),
    backgroundInBase64: await convertFileToBase64(documentBackgroundFile.value)
  }

  let createdRequirements: RequirementDTO[] = []

  requirements.value
      .map(r => ({ number: (r.number || '').trim(), content: (r.content || '').trim() }))
      .filter(r => r.content.length > 0)
      .forEach(r => {
        const req: RequirementDTO = {
          id: generateId(),
          number: r.number || '',
          content: r.content,
          rankId: rankId,
          taskIds: []
        }
        createdRequirements.push(req)
      })

  createdRequirements.forEach((requirement: RequirementDTO) => {Requirement.add(requirement)})
  rank.requirementIds = createdRequirements.map(requirement => requirement.id)

  if (editedRank.value) {

    if (rank.iconInBase64 === '') {
      rank.iconInBase64 = editedRank.value.iconInBase64
    }
    if (rank.backgroundInBase64 === '') {
      rank.backgroundInBase64 = editedRank.value.backgroundInBase64
    }
    if (editedRank.value.id < 10) {
      await Rank.add(rank)
    }
    else {
      rank.id = editedRank.value.id
      await Rank.update(rank)
    }
    resetForm()
  }else {
    await Rank.add(rank)
    resetForm()
  }
}

function checkFileSize(file: File, maxSizeKB: number): boolean {
  const maxSizeBytes = maxSizeKB * 1024
  if (file.size > maxSizeBytes) {
    alert(`File too large. Max ${maxSizeKB} KB.`)
    return false
  }
  return true
}

function convertFileToBase64(file: File | null): Promise<string> {
  if (!file) return Promise.resolve('')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function onFileChange(e: Event, maxSizeKB = 2000, fileRefName: 'iconFile' | 'documentBackgroundFile') {
  const fileRef: Ref<File | null> = fileRefName === 'iconFile' ? iconFile : documentBackgroundFile
  const input = e.target as HTMLInputElement | null
  const file = input?.files?.[0] ?? null
  if (!file) {
    fileRef.value = null
    return
  }
  if (!checkFileSize(file, maxSizeKB)) {
    if (input) input.value = ''
    fileRef.value = null
    return
  }
  fileRef.value = file
}
</script>

<template>
  <div style="display: flex">


    <form @submit.prevent="onSubmit" class="form">
      <div>
        <label> {{$t('rank.basedOn')}} </label>
        <DropDownSelectionComponent
            v-model="test"
            @update:model-value="e=>{editRank(e)}"
            :options="allRanks.map(e=>({label : e.fullName, value: e.id}))"
            backgroundColor="var(--primary-color)"
        />
        <small>{{ $t('info.change')}}</small>
      </div>

      <div>
        <label>{{ $t('rank.fullName') }}</label>
        <input class="text-input-component custom-input" v-model="fullName" required />
      </div>

      <div>
        <label>{{ $t('rank.shortName') }}</label>
        <input class="text-input-component custom-input" v-model="shortName" />
      </div>

      <div>
        <label>{{ $t('rank.idea') }}</label>
        <textarea class="text-input-component custom-input" v-model="idea"></textarea>
      </div>

      <div class="input-list">
        <label>{{ $t('rank.startRequirements') }}</label>
        <div v-for="(req, i) in startRequirements" :key="`start-${i}`" class="input-list-item">
          <input class="text-input-component custom-input" v-model="startRequirements[i]" :placeholder="$t('content')"  />
          <button-component buttonStyle="error" @click="removeStartReq(i)" v-if="startRequirements.length>1" button-text="-"/>
        </div>
        <button-component style="align-self: flex-end" buttonStyle="success" button-text="+" @click="addStartReq"/>
      </div>

      <div class="input-list">
        <label>{{ $t('rank.endRequirements') }}</label>
        <div v-for="(req, i) in endRequirements" :key="`end-${i}`" class="input-list-item">
          <input class="text-input-component custom-input" v-model="endRequirements[i]" :placeholder="$t('content')" />
          <button-component buttonStyle="error" @click="removeEndReq(i)" v-if="endRequirements.length>1" button-text="-"/>
        </div>
        <button-component style="align-self: flex-end" buttonStyle="success" button-text="+" @click="addEndReq"/>
      </div>

      <div class="input-list">
        <label> {{ $t('rank.requirements') }} </label>
        <div v-for="(r, i) in requirements" :key="`req-${i}`" class="input-list-item">
          <div style="display:flex; gap:8px; width: 100%">
            <input class="text-input-component custom-input" v-model="requirements[i].number" style="width:100px;" :placeholder="$t('requirement.number')" />
            <input class="text-input-component custom-input" v-model="requirements[i].content" style="" :placeholder="$t('requirement.description')"/>
          </div>
          <div>
            <button-component buttonStyle="error" @click="removeRequirement(i)" v-if="requirements.length>1" button-text="-"/>
          </div>
        </div>
        <button-component style="align-self: flex-end" buttonStyle="success" button-text="+" @click="addRequirement"/>
      </div>

      <div>
        <label> {{ $t('rank.color') }} </label>
        <div>
          <input
              v-model="color"
              type="color"
          />
        </div>
      </div>

      <div class="input-list">
        <label> {{ $t('rank.icon') }} </label>
        <div class="input-list-item" style="flex-direction: column">
          <input
              class="text-input-component custom-input"
              accept=".png"
              type="file"
              @change="e => onFileChange(e, 2000, 'iconFile')"
          />
          <small>{{ $t('info.fileSizeLimit') }}</small>
        </div>
      </div>

      <div class="input-list">
        <label> {{ $t('rank.documentBackground') }} </label>
        <div class="input-list-item" style="flex-direction: column">
        <input
            class="text-input-component custom-input"
            accept=".png"
            type="file"
            @change="e => onFileChange(e, 2000, 'documentBackgroundFile')"
        />
          <small>{{ $t('info.fileSizeLimit') }}</small>
        </div>
      </div>

      <button type="submit">
        <button-component buttonStyle="success" :button-text="$t('rank.add')" />
      </button>
    </form>
    <div class="form">
      <h2>{{ $t('rank.existingRanks') }}</h2>
      <div v-for="rank in allLocalRanks" :key="rank.id" class="rank-item box-shadow"
           :style="rank.iconInBase64 ? { backgroundImage: `url(data:image/png;base64,${rank.iconInBase64})` } : {}">
          <h3>{{ rank.fullName }} ({{ rank.shortName }})</h3>
          <div style="display:flex; gap:8px; width: 100%">
            <button-component buttonStyle="info" @click="editRank(rank.id)" :button-text="$t('rank.edit')" />
            <button-component buttonStyle="error" @click="() => {action = deleteRank; message = t('info.deleted'); id = rank.id }" :button-text="$t('rank.delete')" />
          </div>
        </div>
    </div>
    <PopupComponent
        v-if="message !== null"
        :title="$t('popups.delete.title')"
        :message="$t('popups.delete.message')"
        :option-one="{ text: $t('edit.delete'), action: () => { action() ; message = null } }"
        :option-two="{ text: $t('edit.cancel'), action: () => { message = null } }"
    />
  </div>



</template>

<style scoped>
.form {
  width: 640px;
  margin: 24px auto;
  display: flex;
  flex-direction: column;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 20px;
  border-radius: 10px;
  background: var(--primary-color-light, rgba(30,47,92,0.04));
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  font-family: 'Museo', sans-serif;
  color: var(--background-color);
}

label {
  display: block;
  font-size: 0.95rem;
  margin-bottom: 6px;
  font-weight: 500;
}

.custom-input {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 30px;
  appearance: none;
}

button{
  background: none;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 6px;
  background: rgba(0,0,0,0.04);
}

input:focus, select:focus, textarea:focus {
  outline: 2px solid var(--primary-color-light);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .form {
    padding: 14px;
    margin: 12px;
  }
}

.input-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-list-item {
  display: flex;
  gap: 8px;
}

.rank-item{
  padding: 20px;
  border-radius: 8px;
  --bg-image: none;
  background-image: var(--bg-image);
  background-repeat: no-repeat;
  background-size: 100px auto;
  background-position: right top;
}

.rank-item:before{
  background-image: var(--bg-image);
}
</style>
