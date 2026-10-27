# 省一点

一个帮你在花钱前停 10 秒的轻量记账 PWA。

**在线使用：** https://wugui011-sudo.github.io/shengyidian/

## 功能

- 每日额度，而不是月底才看到的月账单
- 3 秒记一笔：自定义键盘、分类、需要/想要
- 「想要」超过阈值进入 10 秒冷静期
- 冷静清单与「守住的錢」
- 7 日趋势、分类占比、超支天数、深夜消费
- 数据保存在本机 localStorage，支持 CSV 导出

## 安装

- iPhone：Safari 打开 → 分享 → 添加到主屏幕
- Android：Chrome 打开 → 菜单 → 安装应用 / 添加到主屏幕

## 本地运行

```powershell
python -m http.server 8765
```

打开 http://127.0.0.1:8765/。

## 技术

纯静态 HTML / CSS / JavaScript，无构建步骤。PWA manifest、Service Worker、离线缓存与图标均已配置。

> 第一次打开是空白账本，直接记自己的账。需要清空时在「我的 → 清空账本」点两次确认。
