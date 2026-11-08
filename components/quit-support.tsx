import { cannabisSupport } from "@/lib/data/cannabis"
import type { Substance } from "@/lib/substances"

const outbound = "font-medium text-foreground underline-offset-4 hover:underline"

/**
 * The help that measurably changes outcomes, which a tracker on its own is not.
 *
 * Stated at the strength of the evidence and no further: nicotine replacement
 * and prescription medication both raise quit rates in Cochrane reviews, and
 * stop-smoking services add to that. It points at the free routes first.
 */
const OPTIONS = [
  {
    title: "Nicotine replacement",
    body: "Patches, gum, lozenges and sprays take the edge off withdrawal. A daily patch plus a fast-acting one for sudden cravings works better than either alone. A pharmacist can help with the strength.",
  },
  {
    title: "Prescription medication",
    body: "Varenicline and bupropion both make quitting more likely. They need a prescription, so ask a doctor whether either suits you.",
  },
  {
    title: "Free support",
    body: "Stop-smoking services and quitlines cost nothing and improve the odds further, especially combined with the above.",
  },
]

export function QuitSupport({
  substance = "cigarettes",
  named = false,
}: {
  substance?: Substance
  /** Say which quit this is for, when the page shows both. */
  named?: boolean
}) {
  const options = substance === "cannabis" ? cannabisSupport : OPTIONS
  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground">
        {named
          ? `Help with stopping ${substance === "cannabis" ? "cannabis" : "smoking"}`
          : "Help that improves your odds"}
      </h2>
      <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
        {options.map((option) => (
          <li key={option.title} className="py-4">
            <h3 className="font-medium tracking-tight">{option.title}</h3>
            <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">{option.body}</p>
          </li>
        ))}
      </ul>
      {substance === "cannabis" ? (
        <p className="mt-4 text-sm text-muted-foreground">
          US: the SAMHSA National Helpline,{" "}
          <a href="tel:18006624357" className={outbound}>
            1-800-662-4357
          </a>
          , free and open all day, every day. UK:{" "}
          <a href="tel:03001236600" className={outbound}>
            FRANK on 0300 123 6600
          </a>{" "}
          or{" "}
          <a
            href="https://www.talktofrank.com"
            className={outbound}
            rel="noopener noreferrer"
            target="_blank"
          >
            talktofrank.com
          </a>
          . Elsewhere, your health service will have its own.
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          US: call{" "}
          <a href="tel:18007848669" className={outbound}>
            1-800-QUIT-NOW
          </a>{" "}
          or visit{" "}
          <a
            href="https://smokefree.gov"
            className={outbound}
            rel="noopener noreferrer"
            target="_blank"
          >
            smokefree.gov
          </a>
          . UK:{" "}
          <a
            href="https://www.nhs.uk/better-health/quit-smoking/"
            className={outbound}
            rel="noopener noreferrer"
            target="_blank"
          >
            NHS Quit Smoking
          </a>
          . Elsewhere, your health service will have its own.
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Information, not medical advice.</p>
    </section>
  )
}
