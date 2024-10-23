import clsx from 'clsx'
import { t } from 'i18next'
import { Link } from 'react-router-dom'
import LogoSvg from '../../assets/images/logo.svg'

const cardClasses = clsx('flex h-[200px] w-full items-center justify-center rounded-[20px] bg-white text-2xl/5 font-bold text-[#7A86A5]')

export default function HomePage() {
  return (
    <div className="mx-auto flex h-full w-[1440px] flex-col items-center px-40">
      <img src={LogoSvg} alt="Logo" className="mt-[114px]" />
      <h1 className="mt-[19px] text-6xl font-medium leading-[80px] text-[#6E86C2]">Crypto Safe</h1>
      <div className="mt-[91px] flex w-full justify-between gap-20">
        <Link to="/" className={cardClasses}>
          {t('home.legacy')}
        </Link>
        <Link to="/" className={cardClasses}>
          {t('home.pension')}
        </Link>
        <Link to="/" className={cardClasses}>
          {t('home.trust')}
        </Link>
      </div>
    </div>
  )
}
