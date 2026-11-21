import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

// v3: 密码 / 2FA 默认值改为关闭。旧 key 里记着 want2fa=true，加载时会覆盖
// 新默认值，所以升版本一次性丢弃旧记忆（代理等回到默认，需要重填一次）。
const KEY = 'gpt_outlook_register_form_v3'

// 跨页面共享 + localStorage 持久化的表单字段
// （proxy 在 注册 / 自动跑号 / Plus 检测 三处共用）
const defaults = {
  proxy: '',
  otpTimeout: 10,
  autoConcurrency: 1,
  autoCoolDown: 3,
  autoTargetCount: 0,
  // 密码 / 2FA 都**默认关闭**（2026-11 主人要求）。
  // 仍然拆成单次/批量两组：单次页是试验台，批量页动辄几百个号，
  // 两边临时改动互不影响。localStorage 只记住上次选择，不改变默认值。
  wantPassword: false,
  autoWantPassword: false,
  want2fa: false,
  autoWant2fa: false,
}

// el-select 的 clearable 清空时把值写成 **undefined**（不是 ''），而 proxy 在三个
// 页面都是 `form.value.proxy.trim()` 直接调 —— 主人点一次叉，下次提交就
// "Cannot read properties of undefined (reading 'trim')"。这里统一兜底成字符串，
// 免得每个调用点各写各的可选链，也顺手挡住 localStorage 里的历史脏值。
export function proxyText(form) {
  return String(form?.proxy ?? '').trim()
}

export const useFormStore = defineStore('form', () => {
  let saved = {}
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (_) { saved = {} }
  const form = reactive({ ...defaults, ...saved })

  // clearable 清空后 proxy 会变成 undefined 并被持久化进 localStorage，
  // 刷新页面后依然是 undefined。这里watch 回填成 ''，保证存量数据也是干净的。
  watch(() => form.proxy, (v) => {
    if (v === undefined || v === null) form.proxy = ''
  })

  watch(form, (v) => {
    try { localStorage.setItem(KEY, JSON.stringify(v)) } catch (_) {}
  }, { deep: true })

  return { form }
})
