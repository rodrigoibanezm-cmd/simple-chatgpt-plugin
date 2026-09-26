# Runtime Brand Experience — Estado actual v0.1

Fecha: 2026-09-26

## Alcance de este documento

Este documento registra únicamente las decisiones alcanzadas hasta ahora para la generación runtime de piezas visuales en el plugin de Simple Chile.

No describe el producto completo, no define trabajo futuro y no constituye una especificación final del renderer.

## Idea central

La experiencia comienza en una interfaz conversacional.

Una pregunta del usuario no debe resolverse seleccionando una pieza gráfica prearmada ni una ruta hardcodeada por industria, cliente o tipo de pregunta. La pieza se construye en runtime a partir de la intención de la pregunta, evidencia certificada y assets disponibles.

Principio acordado:

> Hardcodeamos al director de arte, no la pieza gráfica.

Esto significa que la identidad y las restricciones visuales de Simple son estables, mientras que la pieza concreta puede variar según la conversación.

## Separación de responsabilidades

El estado actual contempla dos responsabilidades semánticas separadas:

### Dirección Creativa

Recibe la pregunta del usuario, evidencia certificada y assets disponibles.

Su responsabilidad es definir qué pieza conviene construir: idea central, mensaje, selección y omisión de evidencia, protagonismo, progresión narrativa, apertura y cierre.

No define layout, tipografía, colores, animaciones, transiciones, CSS ni implementación.

### Dirección de Arte

Es una responsabilidad distinta de Dirección Creativa.

Su ámbito es la materialización visual de una dirección creativa dentro de la identidad de Simple.

En el estado actual no se ha definido todavía un contrato de salida para esta responsabilidad.

## Uso de semántica del LLM

Los conceptos "Dirección Creativa" y "Dirección de Arte" se usan por su significado semántico, no como role-play.

La intención es aprovechar conceptos profesionales ya representados en el modelo para expresar responsabilidades complejas sin reemplazarlas por una gran cantidad de reglas artificiales.

Asignar solamente un personaje o título al modelo no se considera suficiente. La tarea se delimita mediante inputs, responsabilidades, restricciones y un contrato estructurado.

## Creative Director v0.1

Se acordó mantener una instrucción de sistema mínima y entregar el trabajo principalmente como un objeto JSON.

### Instrucción de sistema

```text
Produce creative direction from the supplied contract.
Treat certified evidence and assets as authoritative.
Return only valid JSON matching the requested output schema.
```

### Contrato de entrada

```json
{
  "role": "creative_director",
  "assignment": {
    "objective": "Create the creative direction for a short visual piece that answers the user's question.",
    "context": "The piece will be experienced inside a conversational interface.",
    "target_duration_seconds": 15
  },
  "creative_principles": [
    "creative direction",
    "visual storytelling",
    "relevance to user intent"
  ],
  "responsibilities": [
    "find one central creative idea",
    "decide what the story should communicate",
    "select which evidence deserves protagonism",
    "decide what to show and what to omit",
    "define the narrative progression",
    "define the opening and closing"
  ],
  "boundaries": [
    "use only supplied certified evidence and assets",
    "never invent facts, clients, works, credentials or assets",
    "prefer showing evidence over explaining it",
    "do not try to include everything",
    "do not specify layout, typography, colors, transitions, animation or implementation"
  ],
  "input": {
    "user_question": "...",
    "certified_evidence": [],
    "available_assets": []
  },
  "output_schema": {
    "idea": "string",
    "message": "string",
    "story": [
      {
        "purpose": "string",
        "evidence_refs": ["string"],
        "direction": "string"
      }
    ]
  }
}
```

## CreativeBrief v0.1

La salida acordada del Director Creativo es deliberadamente pequeña:

```json
{
  "idea": "string",
  "message": "string",
  "story": [
    {
      "purpose": "string",
      "evidence_refs": ["string"],
      "direction": "string"
    }
  ]
}
```

`purpose` permanece como texto libre. No se definieron enums de escenas, templates ni layouts.

El CreativeBrief describe intención narrativa. No es una especificación de render.

## Ejemplo 1 — Outdoor

### Input conceptual

Pregunta:

```text
¿Simple tiene experiencia con marcas outdoor?
```

Evidencia disponible:

```text
RKF — Naturaleza
Under Armour — Volando
CAT — DBZ
Columbia — cliente
Burton — cliente
97 personas
Fundada en 2011
Full service
```

### CreativeBrief

```json
{
  "idea": "Simple ya habla el lenguaje de las marcas que viven afuera.",
  "message": "La experiencia de Simple en outdoor se demuestra mejor a través del trabajo que explicándola.",
  "story": [
    {
      "purpose": "hook",
      "direction": "Abrir directamente en el territorio outdoor."
    },
    {
      "purpose": "proof",
      "evidence_refs": [
        "RKF_NATURALEZA",
        "UNDER_ARMOUR_VOLANDO",
        "CAT_DBZ"
      ],
      "direction": "Construir la respuesta alrededor de trabajos reales y distintos entre sí."
    },
    {
      "purpose": "breadth",
      "evidence_refs": [
        "COLUMBIA",
        "BURTON"
      ],
      "direction": "Ampliar brevemente la señal mostrando que la relación con la categoría no termina en esos trabajos."
    },
    {
      "purpose": "close",
      "direction": "Cerrar dejando instalada experiencia concreta en outdoor, no una afirmación genérica de capacidad."
    }
  ]
}
```

## Ejemplo 2 — Conocer Simple

### Input conceptual

Pregunta:

```text
Quiero conocer Simple en 15 segundos.
```

### CreativeBrief

```json
{
  "idea": "Conocer Simple a través de lo que hace, no de una presentación corporativa.",
  "message": "Simple es una agencia independiente donde las ideas se traducen en trabajo para marcas diversas.",
  "story": [
    {
      "purpose": "identity",
      "evidence_refs": ["POSITIONING"],
      "direction": "Abrir con una expresión mínima de la manera en que Simple entiende su trabajo."
    },
    {
      "purpose": "show",
      "evidence_refs": ["WORK_1", "WORK_2", "WORK_3"],
      "direction": "Hacer que una selección breve de trabajos sea el centro de la historia."
    },
    {
      "purpose": "dimension",
      "evidence_refs": ["FOUNDED_2011", "TEAM_97"],
      "direction": "Dar escala y trayectoria sin convertirlo en una ficha corporativa."
    },
    {
      "purpose": "close",
      "evidence_refs": ["CAPABILITIES"],
      "direction": "Cerrar mostrando la amplitud de lo que Simple puede hacer."
    }
  ]
}
```

## Restricciones establecidas

- La pieza no se hardcodea por pregunta, industria o cliente.
- La Dirección Creativa sólo puede utilizar evidencia y assets suministrados.
- La Dirección Creativa no diseña ni implementa la pieza.
- El CreativeBrief no contiene CSS, layout, tipografía, color, transición ni animación.
- No se han definido templates narrativos obligatorios.
- No se han definido enums de `purpose`.
- La identidad visual pertenece al ámbito de Dirección de Arte, no al CreativeBrief.
