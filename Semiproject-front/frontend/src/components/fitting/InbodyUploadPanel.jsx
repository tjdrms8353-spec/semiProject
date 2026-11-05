import { useEffect, useRef, useState } from 'react'
import { extractInbody, listInbodyRecords, saveConfirmedInbody } from '../../services/inbodyUpload.js'

export default function InbodyUploadPanel({ token, disabled, onApply, onSelectRecord, onExpired }) {
  const [file, setFile] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [result, setResult] = useState(null)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [muscle, setMuscle] = useState('')
  const [fat, setFat] = useState('')
  const [measuredAt, setMeasuredAt] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [records, setRecords] = useState(null)
  const controller = useRef(null)
  useEffect(() => () => controller.current?.abort(), [])
  const twoDecimals = value => value !== '' && Number.isFinite(Number(value))
    && Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 1e-7
  const valid = twoDecimals(height) && twoDecimals(weight)
    && Number(height) >= 100 && Number(height) <= 230 && Number(weight) >= 20 && Number(weight) <= 300
  const muscleValid = twoDecimals(muscle) && Number(muscle) > 0 && Number(muscle) <= Number(weight)
  const fatValid = twoDecimals(fat) && Number(fat) >= 0 && Number(fat) <= 100
  const dateMs = measuredAt ? new Date(measuredAt).getTime() : NaN
  const dateValid = Number.isFinite(dateMs) && dateMs >= new Date('1000-01-01T00:00').getTime() && dateMs <= Date.now()

  async function upload(event) {
    event.preventDefault()
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setLoading(true); setResult(null); setConfirmed(false); setMessage('')
    try {
      const preview = await extractInbody(token, file, request.signal)
      if (request.signal.aborted) return
      setResult(preview)
      setHeight(preview.values.height_cm ?? '')
      setWeight(preview.values.weight_kg ?? '')
      setMuscle(preview.values.skeletal_muscle_kg ?? '')
      setFat(preview.values.body_fat_pct ?? '')
      setMeasuredAt('')
      setMessage('원본과 대조하고 누락된 값을 입력해 주세요.')
    } catch (error) {
      if (request.signal.aborted) return
      setMessage(error instanceof TypeError ? '백엔드에 연결할 수 없습니다. 실행 상태와 연결 설정을 확인해 주세요.' : error.message)
      if (error.status === 401) onExpired()
    } finally {
      if (!request.signal.aborted) setLoading(false)
    }
  }

  async function loadRecords() {
    setLoading(true)
    try { setRecords(await listInbodyRecords(token)) }
    catch (error) {
      setMessage(error.message)
      if (error.status === 401) onExpired()
    } finally { setLoading(false) }
  }

  return <section aria-label="인바디 파일에서 치수 불러오기">
    <h2>인바디 파일 불러오기</h2>
    <p>PDF·PNG·JPEG, 최대 10MiB, PDF 최대 3페이지. 이미지·스캔 PDF는 서버 OCR 설정이 필요합니다.</p>
    <form onSubmit={upload}>
      <fieldset disabled={disabled || loading}>
        <label>인바디 파일<input key={fileInputKey} type="file" accept=".pdf,.png,.jpg,.jpeg" required onChange={event => {
          setFile(event.target.files?.[0] ?? null); setResult(null); setConfirmed(false); setMessage('')
        }} /></label>
        <button type="submit" disabled={!file}>수치 추출하기</button>
      </fieldset>
    </form>
    <p role="status">{loading ? '수치를 추출하는 중입니다…' : message}</p>
    {result && <>
    <form onSubmit={event => {
      event.preventDefault()
      if (!confirmed || !valid) return
      onApply({ height_cm: Number(height), weight_kg: Number(weight) })
      setConfirmed(false)
      setMessage('확인한 키·체중을 화면에 반영했습니다. DB에는 저장하지 않았습니다.')
    }}>
      <fieldset disabled={disabled || loading}>
        <legend>추출 결과 확인</legend>
        <label>키 (cm)<input type="number" min="100" max="230" step="any" value={height} required
          onChange={e => { setHeight(e.target.value); setConfirmed(false) }} /></label>
        <label>체중 (kg)<input type="number" min="20" max="300" step="any" value={weight} required
          onChange={e => { setWeight(e.target.value); setConfirmed(false) }} /></label>
        <p>골격근량: {result.values.skeletal_muscle_kg ?? '미추출'} kg · 체지방률: {result.values.body_fat_pct ?? '미추출'} %</p>
        <p>골격근량·체지방률은 참고용입니다. 부위별 치수를 자동 추정하지 않습니다.</p>
        <ul>{result.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>
        <label className="fitting-toggle"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />원본과 키·체중을 대조했습니다.</label>
        <button type="submit" disabled={!valid || !confirmed}>확인한 키·체중 반영</button>
      </fieldset>
    </form>
    <form onSubmit={async event => {
      event.preventDefault()
      if (!confirmed || !valid) return
      setLoading(true)
      try {
        // datetime-local is interpreted in the device's local timezone; toISOString converts it to UTC.
        const measured = new Date(measuredAt).toISOString()
        const saved = await saveConfirmedInbody(token, {
          height_cm: Number(height), weight_kg: Number(weight),
          skeletal_muscle_kg: Number(muscle), body_fat_pct: Number(fat), measured_at: measured,
        })
        setMessage(`인바디 기록을 저장했습니다. 기록 번호 ${saved.id}. 원본 파일은 저장하지 않았습니다.`)
        setResult(null); setFile(null); setConfirmed(false)
        setFileInputKey(key => key + 1)
        try { setRecords(await listInbodyRecords(token)) }
        catch { setMessage(`인바디 기록 ${saved.id}번을 저장했습니다. 최근 목록을 갱신하지 못해 다시 불러와야 합니다.`) }
      } catch (error) {
        setMessage(error instanceof TypeError ? '백엔드에 연결할 수 없습니다.' : error.message)
        if (error.status === 401) onExpired()
      } finally { setLoading(false) }
    }}>
      <fieldset disabled={disabled || loading}>
        <legend>인바디 기록 저장 (선택)</legend>
        <label>골격근량 (kg)<input type="number" min="0.01" max="300" step="0.01" required value={muscle}
          onChange={e => { setMuscle(e.target.value); setConfirmed(false) }} /></label>
        <label>체지방률 (%)<input type="number" min="0" max="100" step="0.01" required value={fat}
          onChange={e => { setFat(e.target.value); setConfirmed(false) }} /></label>
        <label>측정 일시 (기기 현지 시각)<input type="datetime-local" required value={measuredAt}
          onChange={e => { setMeasuredAt(e.target.value); setConfirmed(false) }} /></label>
        {!valid && <p role="alert">키·체중은 허용 범위 안에서 소수점 둘째 자리까지 입력해 주세요.</p>}
        {!muscleValid && <p role="alert">골격근량은 0보다 크고 체중 이하이며 소수점 둘째 자리까지여야 합니다.</p>}
        {!fatValid && <p role="alert">체지방률은 0~100%, 소수점 둘째 자리까지 입력해 주세요.</p>}
        {measuredAt && !dateValid && <p role="alert">측정 시각은 1000년 이후, 현재 시각 이하여야 합니다.</p>}
        <label className="fitting-toggle"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />모든 수치와 측정 시각을 원본에서 확인했습니다.</label>
        <button type="submit" disabled={!confirmed || !valid || !muscleValid || !fatValid || !dateValid}>확인한 인바디 기록 저장</button>
      </fieldset>
    </form>
    <div className="fitting-actions">
      <button type="button" disabled={disabled || loading} onClick={loadRecords}>내 최근 인바디 기록 보기</button>
    </div>
    {records && <div aria-live="polite">
      <h3>최근 인바디 기록</h3>
      {records.length === 0 ? <p>저장된 인바디 기록이 없습니다.</p> : <ul className="fitting-records">
        {records.map(record => <li key={record.id}>
          <div><strong>{new Date(record.measured_at).toLocaleString()}</strong>
            <span>키 {record.height_cm}cm · 체중 {record.weight_kg}kg · 골격근량 {record.skeletal_muscle_kg}kg · 체지방률 {record.body_fat_pct}%</span></div>
          <button type="button" disabled={disabled || loading} onClick={() => onSelectRecord(record)}>피팅에 불러오기</button>
        </li>)}
      </ul>}
    </div>}
    <p>저장은 선택 사항입니다. 확인한 값만 로그인한 회원의 인바디 기록으로 저장하고, 원본 파일은 저장하지 않습니다. 기존 기록을 갱신하지 않고 새 기록을 추가합니다.</p>
    </>}
  </section>
}
