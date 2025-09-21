import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils.js'

describe('utils', () => {
  describe('cn', () => {
    it('应该合并类名', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('应该处理条件类名', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toBe('base conditional')
    })

    it('应该处理对象形式的类名', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'primary': true
      })
      expect(result).toBe('active primary')
    })

    it('应该处理数组形式的类名', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('应该处理Tailwind冲突类名', () => {
      // twMerge 应该处理冲突的 Tailwind 类名
      const result = cn('px-2 py-1 px-3')
      expect(result).toBe('py-1 px-3')
    })

    it('应该处理空值和undefined', () => {
      const result = cn('class1', null, undefined, '', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('应该处理复杂的混合情况', () => {
      const isActive = true
      const isDisabled = false
      const variant = 'primary'
      
      const result = cn(
        'base-class',
        {
          'active': isActive,
          'disabled': isDisabled
        },
        variant === 'primary' && 'primary-variant',
        ['additional', 'classes']
      )
      
      expect(result).toBe('base-class active primary-variant additional classes')
    })

    it('应该处理没有参数的情况', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('应该处理单个参数', () => {
      const result = cn('single-class')
      expect(result).toBe('single-class')
    })

    it('应该处理嵌套数组', () => {
      const result = cn(['class1', ['nested1', 'nested2']], 'class3')
      expect(result).toBe('class1 nested1 nested2 class3')
    })

    it('应该处理函数返回的类名', () => {
      const getClass = () => 'dynamic-class'
      const result = cn('static-class', getClass())
      expect(result).toBe('static-class dynamic-class')
    })
  })
})