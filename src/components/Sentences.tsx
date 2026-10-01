/**
 * 설명 문단을 문장마다 줄을 바꿔 그린다.
 *
 * 두세 문장짜리 설명이 폭에 맞춰 흘러가면 다음 문장이 줄 한가운데서 시작해
 * 어디서 생각이 바뀌는지 안 보인다. 문장 끝(. ! ?) 뒤의 공백에서 끊어 문장마다
 * 새 줄로 시작하게 한다. 소수점(27.94)처럼 마침표 뒤에 공백이 없는 곳은 끊지 않는다.
 * 한 문장 안의 줄바꿈은 그대로 브라우저(keep-all · text-wrap: pretty)에 맡긴다.
 */
export function Sentences({ text }: { text: string }) {
  const parts = text.split(/(?<=[.!?])\s+/)
  if (parts.length < 2) return <>{text}</>
  return (
    <>
      {parts.map((sentence, i) => (
        <span key={i} className="block">
          {sentence}
        </span>
      ))}
    </>
  )
}
