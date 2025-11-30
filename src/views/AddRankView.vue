```vue
<script setup lang="ts">
import { ref } from 'vue'
import {Rank, RankDTO} from '../scripts/Model/Rank'
import {Requirement, RequirementDTO} from '../scripts/Model/Requirement'
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

const fullName = ref('')
const shortName = ref('')
const idea = ref('')

const startRequirements = ref<string[]>([''])
const endRequirements = ref<string[]>([''])

const requirements = ref<{ number: string; content: string }[]>([
  { number: '', content: '' }
])

const success = ref('')

const addStartReq = () => startRequirements.value.push('')
const removeStartReq = (i: number) => startRequirements.value.splice(i, 1)
const addEndReq = () => endRequirements.value.push('')
const removeEndReq = (i: number) => endRequirements.value.splice(i, 1)

const addRequirement = () => requirements.value.push({ number: '', content: '' })
const removeRequirement = (i: number) => requirements.value.splice(i, 1)

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
    ranksInProgressIds: []
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
  await Rank.add(rank)

  fullName.value = ''
  shortName.value = ''
  idea.value = ''
  startRequirements.value = ['']
  endRequirements.value = ['']
  requirements.value = [{ number: '', content: '' }]
  success.value = 'Ranga i powiązane wymagania zostały dodane'
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="form">
    <div>
      <label>{{ $t('rank.fullName') }}</label>
      <input v-model="fullName" required />
    </div>

    <div>
      <label>{{ $t('rank.shortName') }}</label>
      <input v-model="shortName" />
    </div>

    <div>
      <label>{{ $t('rank.idea') }}</label>
      <textarea v-model="idea"></textarea>
    </div>

    <div>
      <label>{{ $t('rank.startRequirements') }}</label>
      <div v-for="(req, i) in startRequirements" :key="`start-${i}`" style="display:flex; gap:8px; align-items:center;">
        <input v-model="startRequirements[i]" placeholder="np. wymaganie 1" />
        <button type="button" @click="removeStartReq(i)" v-if="startRequirements.length>1">-</button>
      </div>
      <button type="button" @click="addStartReq">+ {{ $t('common.add') }}</button>
    </div>

    <div>
      <label>{{ $t('rank.endRequirements') }}</label>
      <div v-for="(req, i) in endRequirements" :key="`end-${i}`" style="display:flex; gap:8px; align-items:center;">
        <input v-model="endRequirements[i]" placeholder="np. wymaganie końcowe" />
        <button type="button" @click="removeEndReq(i)" v-if="endRequirements.length>1">-</button>
      </div>
      <button type="button" @click="addEndReq">+ {{ $t('common.add') }}</button>
    </div>

    <div>
      <label>Wymagania (utwórz nowe zamiast podawać id)</label>
      <div v-for="(r, i) in requirements" :key="`req-${i}`" style="display:grid; grid-template-columns: 1fr auto; gap:8px; align-items:start;">
        <div style="display:flex; gap:8px;">
          <input v-model="requirements[i].number" placeholder="numer (opcjonalnie)" style="width:100px;" />
          <input v-model="requirements[i].content" placeholder="treść wymagania" />
        </div>
        <div>
          <button type="button" @click="removeRequirement(i)" v-if="requirements.length>1">-</button>
        </div>
      </div>
      <button type="button" @click="addRequirement">+ {{ $t('common.addRequirement') || 'Dodaj wymaganie' }}</button>
    </div>

    <div>
      <label>Zdjęcie rangi</label>
      <input type="file"/>
    </div>

    <div>
      <label>Zdjęcie tła dokumentu</label>
      <input type="file"/>
    </div>

    <button type="submit">
      <button-component :button-text="$t('rank.addRank')" />
    </button>
    <p v-if="success" class="success">{{ success }}</p>
  </form>
</template>

<style scoped>
.form {
  max-width: 640px;
  margin: 24px auto;
  display: grid;
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

input, select, textarea {
  padding: 8px 12px;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.08);
  background: var(--background-color);
  color: var(--primary-color);
  width: 100%;
  box-sizing: border-box;
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

.success {
  color: var(--accent-success);
  font-weight: 600;
  margin-top: 8px;
}

@media (max-width: 600px) {
  .form {
    padding: 14px;
    margin: 12px;
  }
}
</style>
