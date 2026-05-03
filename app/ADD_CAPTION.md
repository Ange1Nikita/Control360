# Задача: добавить подпись под компонент планировки

## Файл
`src/components/CinematicFloorplan.jsx`

## Что сделать

Найти в JSX-разметке компонента `CinematicFloorplan` блок с прогресс-точками:

```jsx
<div ref={progRef} style={{ position:'absolute', bottom:32, ... }} />
```

Добавить **после** этого div следующий код:

```jsx
<div style={{ position:"absolute", bottom:10, left:0, right:0, textAlign:"center", pointerEvents:"none" }}>
  <span style={{
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".22em",
    textTransform: "uppercase",
    background: "linear-gradient(90deg, #29abe2, #00d4b8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }}>
    Полный цикл установки слаботочных систем
  </span>
</div>
```

## Итог

Под точками прогресса внизу компонента появится градиентная подпись.
