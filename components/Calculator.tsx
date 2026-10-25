'use client'

import { useState } from 'react'
import { Calculator as CalcIcon, X, Delete } from 'lucide-react'

export default function Calculator() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'gold'>('basic')

  // استیت‌های ماشین حساب معمولی
  const [display, setDisplay] = useState('0')
  
  // استیت‌های ماشین حساب طلا
  const [goldQty, setGoldQty] = useState('')
  const [goldUnit, setGoldUnit] = useState<'TOLA' | 'GRAM' | 'MASHA' | 'KG'>('TOLA')
  const [goldPrice, setGoldPrice] = useState('')

  const handleBtnClick = (val: string) => {
    if (display === '0' && val !== '.') {
      setDisplay(val)
    } else {
      setDisplay(display + val)
    }
  }

  const calculate = () => {
    try {
      // استفاده از eval فقط برای ماشین حساب محلی (خطری ندارد)
      const result = eval(display.replace(/×/g, '*').replace(/÷/g, '/'))
      setDisplay(String(result))
    } catch {
      setDisplay('خطا')
    }
  }

  const clear = () => setDisplay('0')
  const backspace = () => {
    if (display.length > 1) setDisplay(display.slice(0, -1))
    else setDisplay('0')
  }

  // محاسبه قیمت طلا
  const calculateGold = () => {
    const qty = Number(goldQty) || 0
    const price = Number(goldPrice) || 0
    
    let grams = 0
    if (goldUnit === 'TOLA') grams = qty * 11.6638
    else if (goldUnit === 'MASHA') grams = qty * 4.6083
    else if (goldUnit === 'KG') grams = qty * 1000
    else grams = qty

    // قیمت بر اساس واحد انتخابی
    const total = qty * price
    
    return { grams: grams.toFixed(3), total: total.toFixed(2) }
  }

  const goldResult = calculateGold()

  return (
    <>
      {/* دکمه شناور */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white p-4 rounded-full shadow-[0_0_20px_var(--accent-glow)] transition-transform hover:scale-110"
        title="ماشین حساب"
      >
        <CalcIcon size={24} />
      </button>

      {/* پنجره ماشین حساب */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-base)]">
            
            {/* هدر */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-base)] bg-[var(--bg-surface-solid)]">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('basic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'basic' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}
                >
                  معمولی
                </button>
                <button 
                  onClick={() => setActiveTab('gold')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'gold' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}
                >
                  محاسبه طلا
                </button>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[var(--text-secondary)] hover:text-red-500 transition">
                <X size={20} />
              </button>
            </div>

            {/* بدنه ماشین حساب */}
            <div className="p-4">
              {activeTab === 'basic' ? (
                <>
                  <div className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded-2xl p-4 mb-4 text-left overflow-hidden">
                    <div className="text-3xl font-bold text-[var(--text-primary)] truncate" dir="ltr">{display}</div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={clear} className="p-4 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition">C</button>
                    <button onClick={backspace} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] hover:bg-[var(--bg-input)] flex justify-center items-center"><Delete size={18} /></button>
                    <button onClick={() => handleBtnClick('÷')} className="p-4 rounded-xl bg-[var(--accent-bg)] text-[var(--accent)] font-bold hover:bg-[var(--accent)] hover:text-white transition">÷</button>
                    <button onClick={() => handleBtnClick('×')} className="p-4 rounded-xl bg-[var(--accent-bg)] text-[var(--accent)] font-bold hover:bg-[var(--accent)] hover:text-white transition">×</button>

                    <button onClick={() => handleBtnClick('7')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">7</button>
                    <button onClick={() => handleBtnClick('8')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">8</button>
                    <button onClick={() => handleBtnClick('9')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">9</button>
                    <button onClick={() => handleBtnClick('-')} className="p-4 rounded-xl bg-[var(--accent-bg)] text-[var(--accent)] font-bold hover:bg-[var(--accent)] hover:text-white transition">-</button>

                    <button onClick={() => handleBtnClick('4')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">4</button>
                    <button onClick={() => handleBtnClick('5')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">5</button>
                    <button onClick={() => handleBtnClick('6')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">6</button>
                    <button onClick={() => handleBtnClick('+')} className="p-4 rounded-xl bg-[var(--accent-bg)] text-[var(--accent)] font-bold hover:bg-[var(--accent)] hover:text-white transition">+</button>

                    <button onClick={() => handleBtnClick('1')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">1</button>
                    <button onClick={() => handleBtnClick('2')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">2</button>
                    <button onClick={() => handleBtnClick('3')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">3</button>
                    <button onClick={calculate} className="row-span-3 p-4 rounded-xl bg-[var(--accent)] text-white font-bold hover:bg-[var(--accent-hover)] transition shadow-lg">=</button>

                    <button onClick={() => handleBtnClick('0')} className="col-span-2 p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">0</button>
                    <button onClick={() => handleBtnClick('.')} className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-base)] font-bold hover:bg-[var(--bg-input)] transition">.</button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مقدار (وزن)</label>
                    <div className="flex gap-2">
                      <input type="number" value={goldQty} onChange={e => setGoldQty(e.target.value)} placeholder="0.00" dir="ltr" className="flex-1 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                      <select value={goldUnit} onChange={e => setGoldUnit(e.target.value as any)} className="w-24 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-2 py-3 text-sm font-bold focus:outline-none">
                        <option value="TOLA">توله</option>
                        <option value="GRAM">گرام</option>
                        <option value="MASHA">ماشا</option>
                        <option value="KG">کیلو</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">قیمت هر واحد ($)</label>
                    <input type="number" value={goldPrice} onChange={e => setGoldPrice(e.target.value)} placeholder="0.00" dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                  </div>

                  <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-2xl p-4 space-y-3 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">معادل گرم:</span>
                      <span className="font-bold" dir="ltr">{goldResult.grams} g</span>
                    </div>
                    <div className="flex justify-between text-lg border-t border-[var(--border-base)] pt-3 mt-3">
                      <span className="font-bold text-[var(--text-primary)]">قیمت کل:</span>
                      <span className="font-extrabold text-[var(--accent)]" dir="ltr">${goldResult.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}