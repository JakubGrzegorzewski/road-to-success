// Rank artwork, extracted from the former 2.7 MB rank.json (base64) into regular files so that
// they are cached by the service worker and not bundled into JavaScript.
import pwdIcon from '@/assets/ranks/pwd.png'
import phmIcon from '@/assets/ranks/phm.png'
import hmIcon from '@/assets/ranks/hm.png'
import hoIcon from '@/assets/ranks/ho.png'
import hrIcon from '@/assets/ranks/hr.png'
import pwdBackground from '@/assets/ranks/pwd-background.png'
import phmBackground from '@/assets/ranks/phm-background.png'
import hmBackground from '@/assets/ranks/hm-background.png'
import hoBackground from '@/assets/ranks/ho-background.png'
import hrBackground from '@/assets/ranks/hr-background.png'
import type { IRank } from './interfaces'

const ICONS: Record<string, string> = { pwd: pwdIcon, phm: phmIcon, hm: hmIcon, ho: hoIcon, hr: hrIcon }
/** A4 page backgrounds (2481×3508 px) used by the PDF. */
const BACKGROUNDS: Record<string, string> = { pwd: pwdBackground, phm: phmBackground, hm: hmBackground, ho: hoBackground, hr: hrBackground }

export function rankIconUrl(rank: Pick<IRank, 'shortName'> | undefined | null): string | undefined {
    return rank ? ICONS[rank.shortName] : undefined
}

export function rankBackgroundUrl(rank: Pick<IRank, 'shortName'> | undefined | null): string | undefined {
    return rank ? BACKGROUNDS[rank.shortName] : undefined
}
