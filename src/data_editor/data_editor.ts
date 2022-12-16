'use strict'

export {}

declare global {
  interface Window {
    data_editor_state: EditorState
  }
}

interface EditorControls {
  bytes_per_line: number
  address_numbering: number
  radix: number
  little_endian: boolean
  logical_encoding: string
  offset: number
  length: number
  edit_byte_size: number
  edit_encoding: BufferEncoding
  lsb_higher_offset: boolean
  bytes_per_row: number
  editor_selection_start: number
  editor_selection_end: number
  editor_cursor_pos: number
  goto_offset: number
}

interface EditorMetrics {
  change_count: number
  data_breakpoint_count: number
  file_byte_count: number
  ascii_byte_count: number
  row_count: number
}

interface EditorElements {
  data_editor: HTMLElement
  address: HTMLTextAreaElement
  physical: HTMLTextAreaElement
  logical: HTMLTextAreaElement
  editor: HTMLTextAreaElement
  physical_offsets: HTMLElement
  logical_offsets: HTMLElement
  selected_offsets: HTMLElement
  editor_offsets: HTMLElement
  data_view_offset: HTMLElement
  commit_button: HTMLInputElement
  add_data_breakpoint_button: HTMLInputElement
  change_count: HTMLElement
  data_breakpoint_count: HTMLElement
  file_byte_count: HTMLElement
  ascii_byte_count: HTMLElement
  file_type: HTMLElement
  file_metrics_vw: HTMLElement
  goto_offset: HTMLInputElement
  radix: HTMLInputElement
  data_vw: HTMLElement
  b8_dv: HTMLElement
  b16_dv: HTMLElement
  b32_dv: HTMLElement
  b64_dv: HTMLElement
  int8_dv: HTMLInputElement
  uint8_dv: HTMLInputElement
  int16_dv: HTMLInputElement
  uint16_dv: HTMLInputElement
  int32_dv: HTMLInputElement
  uint32_dv: HTMLInputElement
  int64_dv: HTMLInputElement
  uint64_dv: HTMLInputElement
  float32_dv: HTMLInputElement
  float64_dv: HTMLInputElement
}

interface EditorState {
  file: File | null
  file_content: Uint8Array | null
  edit_content: Uint8Array
  editor_controls: EditorControls
  editor_metrics: EditorMetrics
  editor_elements: EditorElements
}

function init() {
  window.data_editor_state = {
    file: null,
    file_content: null,
    edit_content: new Uint8Array(0),
    editor_elements: {
      data_editor: document.getElementById('data_editor') as HTMLInputElement,
      address: document.getElementById('address') as HTMLTextAreaElement,
      physical: document.getElementById('physical') as HTMLTextAreaElement,
      logical: document.getElementById('logical') as HTMLTextAreaElement,
      editor: document.getElementById('editor') as HTMLTextAreaElement,
      physical_offsets: document.getElementById(
        'physical_offsets'
      ) as HTMLInputElement,
      logical_offsets: document.getElementById(
        'logical_offsets'
      ) as HTMLInputElement,
      selected_offsets: document.getElementById(
        'selected_offsets'
      ) as HTMLElement,
      editor_offsets: document.getElementById('editor_offsets') as HTMLElement,
      data_view_offset: document.getElementById('offset_dv') as HTMLElement,
      file_byte_count: document.getElementById('file_byte_cnt') as HTMLElement,
      change_count: document.getElementById('change_cnt') as HTMLElement,
      data_breakpoint_count: document.getElementById(
        'data_breakpoint_cnt'
      ) as HTMLElement,
      file_metrics_vw: document.getElementById(
        'file_metrics_vw'
      ) as HTMLElement,
      ascii_byte_count: document.getElementById(
        'ascii_byte_cnt'
      ) as HTMLElement,
      file_type: document.getElementById('file_type') as HTMLElement,
      commit_button: document.getElementById('commit_btn') as HTMLInputElement,
      add_data_breakpoint_button: document.getElementById(
        'add_data_breakpoint_btn'
      ) as HTMLInputElement,
      goto_offset: document.getElementById('goto_offset') as HTMLInputElement,
      radix: document.getElementById('radix') as HTMLInputElement,
      data_vw: document.getElementById('data_vw') as HTMLElement,
      b8_dv: document.getElementById('b8_dv') as HTMLElement,
      b16_dv: document.getElementById('b16_dv') as HTMLElement,
      b32_dv: document.getElementById('b32_dv') as HTMLElement,
      b64_dv: document.getElementById('b64_dv') as HTMLElement,
      int8_dv: document.getElementById('int8_dv') as HTMLInputElement,
      uint8_dv: document.getElementById('uint8_dv') as HTMLInputElement,
      int16_dv: document.getElementById('int16_dv') as HTMLInputElement,
      uint16_dv: document.getElementById('uint16_dv') as HTMLInputElement,
      int32_dv: document.getElementById('int32_dv') as HTMLInputElement,
      uint32_dv: document.getElementById('uint32_dv') as HTMLInputElement,
      int64_dv: document.getElementById('int64_dv') as HTMLInputElement,
      uint64_dv: document.getElementById('uint64_dv') as HTMLInputElement,
      float32_dv: document.getElementById('float32_dv') as HTMLInputElement,
      float64_dv: document.getElementById('float64_dv') as HTMLInputElement,
    },
    editor_controls: {
      bytes_per_line: 8, // [6, 8]
      address_numbering: 10, // [2, 8, 10, 16] | "none"
      radix: 16, // [2, 8, 10, 16]
      little_endian: true, // true | false
      logical_encoding: 'latin1',
      offset: 0, // number
      length: 0, // number
      edit_byte_size: 8, // [6, 7, 8]
      edit_encoding: 'latin1', // [2, 8, 10, 16 ] | "ascii" | "ebcidic" | "utf-8" | "utf-16"
      lsb_higher_offset: true, // true | false
      bytes_per_row: 16,
      editor_selection_start: 0,
      editor_selection_end: 0,
      editor_cursor_pos: 0,
      goto_offset: 0,
    },
    editor_metrics: {
      change_count: 0,
      data_breakpoint_count: 0,
      file_byte_count: 0,
      ascii_byte_count: 0,
      row_count: 0,
    },
  }
  // add listeners
  window.data_editor_state.editor_elements.physical.addEventListener(
    'select',
    () =>
      handleSelected(
        frameSelectedOnWhitespace(
          window.data_editor_state.editor_elements.physical
        )
      )
  )
  window.data_editor_state.editor_elements.logical.addEventListener(
    'select',
    () =>
      handleSelected(
        frameSelected(window.data_editor_state.editor_elements.logical)
      )
  )
  window.data_editor_state.editor_elements.radix.addEventListener(
    'change',
    () => {
      window.data_editor_state.editor_controls.radix = parseInt(
        window.data_editor_state.editor_elements.radix.value
      )
      updateDataView()
    }
  )
  window.data_editor_state.editor_elements.int8_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setInt8(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        window.data_editor_state.editor_elements.int8_dv.valueAsNumber
      )
      updateDataView()
      refreshEditor()
    }
  )
  window.data_editor_state.editor_elements.uint8_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setUint8(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        window.data_editor_state.editor_elements.uint8_dv.valueAsNumber
      )
      updateDataView()
      refreshEditor()
    }
  )
  window.data_editor_state.editor_elements.int16_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setInt16(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        window.data_editor_state.editor_elements.int16_dv.valueAsNumber,
        window.data_editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    }
  )
  window.data_editor_state.editor_elements.uint16_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setUint16(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        window.data_editor_state.editor_elements.uint16_dv.valueAsNumber,
        window.data_editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    }
  )
  window.data_editor_state.editor_elements.int32_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setInt32(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        window.data_editor_state.editor_elements.int32_dv.valueAsNumber,
        window.data_editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    }
  )
  window.data_editor_state.editor_elements.uint32_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setUint32(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        window.data_editor_state.editor_elements.uint32_dv.valueAsNumber,
        window.data_editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    }
  )
  window.data_editor_state.editor_elements.int64_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setBigInt64(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        BigInt(window.data_editor_state.editor_elements.int64_dv.value),
        window.data_editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    }
  )
  window.data_editor_state.editor_elements.uint64_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setBigUint64(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        BigInt(window.data_editor_state.editor_elements.uint32_dv.value),
        window.data_editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    }
  )
  window.data_editor_state.editor_elements.float32_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setFloat32(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        window.data_editor_state.editor_elements.float32_dv.valueAsNumber,
        window.data_editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    }
  )
  window.data_editor_state.editor_elements.float64_dv.addEventListener(
    'change',
    () => {
      new DataView(window.data_editor_state.edit_content.buffer).setFloat64(
        window.data_editor_state.editor_controls.editor_cursor_pos,
        window.data_editor_state.editor_elements.float64_dv.valueAsNumber,
        window.data_editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    }
  )
  const advanced_mode = document.getElementById(
    'advanced_mode'
  ) as HTMLInputElement
  advanced_mode.addEventListener('change', () =>
    enableAdvanced(advanced_mode.checked)
  )
  const address_type = document.getElementById(
    'address_numbering'
  ) as HTMLInputElement
  address_type.addEventListener('change', () =>
    selectAddressType(parseInt(address_type.value))
  )
  const edit_encoding = document.getElementById(
    'edit_encoding'
  ) as HTMLInputElement
  window.data_editor_state.editor_controls.edit_encoding =
    edit_encoding.value as BufferEncoding
  edit_encoding.addEventListener('change', () =>
    selectEditEncoding(edit_encoding.value)
  )
  const file_input = document.getElementById('file_input') as HTMLInputElement
  file_input.addEventListener('change', () => loadContent(file_input.files))
  const endianness = document.getElementById('endianness') as HTMLInputElement
  endianness.addEventListener('change', () =>
    selectEndianness(endianness.value)
  )
  window.data_editor_state.editor_elements.goto_offset.addEventListener(
    'change',
    () => {
      window.data_editor_state.editor_controls.goto_offset = parseInt(
        window.data_editor_state.editor_elements.goto_offset.value
      )
      /* number of pixels per line */
      const line_height =
        window.data_editor_state.editor_elements.physical.scrollHeight /
        window.data_editor_state.editor_metrics.row_count
      /* number of lines to scroll */
      const line =
        Math.ceil(
          window.data_editor_state.editor_controls.goto_offset /
            window.data_editor_state.editor_controls.bytes_per_row
        ) - 1
      window.data_editor_state.editor_elements.physical.scrollTop =
        line * line_height
    }
  )
  // Track the cursor position
  window.data_editor_state.editor_elements.editor.oninput =
    window.data_editor_state.editor_elements.editor.onclick =
    window.data_editor_state.editor_elements.editor.oncontextmenu =
      storeCursorPos
  window.data_editor_state.editor_elements.editor.onkeyup = ({ key }) => {
    if (['Arrow', 'Page', 'Home', 'End'].some((type) => key.startsWith(type))) {
      storeCursorPos()
    }
  }
  // Lock the address, physical and logical views scrollbars together
  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
  window.data_editor_state.editor_elements.physical.onscroll = () => {
    if (!currentScrollEvt || currentScrollEvt === 'physical') {
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = 'physical'
      syncScroll(
        window.data_editor_state.editor_elements.physical,
        window.data_editor_state.editor_elements.address
      )
      syncScroll(
        window.data_editor_state.editor_elements.physical,
        window.data_editor_state.editor_elements.logical
      )
      scrollSyncTimer = setTimeout(function () {
        currentScrollEvt = null
      }, 100)
    }
  }
  window.data_editor_state.editor_elements.address.onscroll = () => {
    if (!currentScrollEvt || currentScrollEvt === 'address') {
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = 'address'
      syncScroll(
        window.data_editor_state.editor_elements.address,
        window.data_editor_state.editor_elements.physical
      )
      syncScroll(
        window.data_editor_state.editor_elements.address,
        window.data_editor_state.editor_elements.logical
      )
      scrollSyncTimer = setTimeout(function () {
        currentScrollEvt = null
      }, 100)
    }
  }
  window.data_editor_state.editor_elements.logical.onscroll = () => {
    if (!currentScrollEvt || currentScrollEvt === 'logical') {
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = 'logical'
      syncScroll(
        window.data_editor_state.editor_elements.logical,
        window.data_editor_state.editor_elements.address
      )
      syncScroll(
        window.data_editor_state.editor_elements.logical,
        window.data_editor_state.editor_elements.physical
      )
      scrollSyncTimer = setTimeout(function () {
        currentScrollEvt = null
      }, 100)
    }
  }
}

function storeCursorPos() {
  window.data_editor_state.editor_controls.editor_cursor_pos =
    window.data_editor_state.editor_elements.editor.selectionStart
  window.data_editor_state.editor_controls.editor_selection_start =
    window.data_editor_state.editor_elements.editor.selectionStart
  window.data_editor_state.editor_controls.editor_selection_end =
    window.data_editor_state.editor_elements.editor.selectionEnd
  window.data_editor_state.editor_elements.editor_offsets.innerHTML =
    window.data_editor_state.editor_controls.editor_selection_start ===
    window.data_editor_state.editor_controls.editor_selection_end
      ? 'cursor: ' +
        String(window.data_editor_state.editor_controls.editor_cursor_pos)
      : 'start: ' +
        String(
          window.data_editor_state.editor_controls.editor_selection_start
        ) +
        ', end: ' +
        String(window.data_editor_state.editor_controls.editor_selection_end) +
        ', cursor: ' +
        String(window.data_editor_state.editor_controls.editor_cursor_pos)
  updateDataView()
}

function selectEndianness(endianness: string) {
  window.data_editor_state.editor_controls.little_endian = endianness == 'le'
  updateDataView()
  window.data_editor_state.editor_elements.editor.focus()
  window.data_editor_state.editor_elements.editor.setSelectionRange(
    window.data_editor_state.editor_controls.editor_selection_start,
    window.data_editor_state.editor_controls.editor_selection_end
  )
}

function loadContent(files: FileList | null) {
  if (files) {
    window.data_editor_state.file = files[0] as File
    window.data_editor_state.editor_elements.editor.value = ''
    window.data_editor_state.editor_elements.commit_button.disabled = false
    window.data_editor_state.editor_elements.add_data_breakpoint_button.disabled =
      false
    window.data_editor_state.editor_metrics.file_byte_count =
      window.data_editor_state.file.size
    window.data_editor_state.editor_controls.goto_offset = 0
    window.data_editor_state.editor_elements.goto_offset.max = String(
      window.data_editor_state.file.size
    )
    window.data_editor_state.editor_elements.goto_offset.value = '0'
    window.data_editor_state.editor_elements.logical_offsets.innerHTML =
      makeOffsetRange(10, 1)
    window.data_editor_state.editor_elements.physical_offsets.innerHTML =
      makeOffsetRange(10, 2)
    window.data_editor_state.editor_elements.address.innerHTML =
      makeAddressRange(
        0,
        Math.ceil(window.data_editor_state.file.size / 16),
        16,
        window.data_editor_state.editor_controls.address_numbering
      )
    window.data_editor_state.editor_elements.file_byte_count.innerHTML = String(
      window.data_editor_state.editor_metrics.file_byte_count
    )
    readFile(window.data_editor_state.file).then((data) => {
      window.data_editor_state.file_content = new Uint8Array(data)
      window.data_editor_state.editor_elements.file_type.innerHTML =
        window.data_editor_state.file!.type
      window.data_editor_state.editor_metrics.ascii_byte_count =
        countAscii(data)
      window.data_editor_state.editor_elements.ascii_byte_count.innerHTML =
        String(window.data_editor_state.editor_metrics.ascii_byte_count)
      window.data_editor_state.editor_elements.physical.innerHTML =
        encodeForDisplay(
          window.data_editor_state.file_content,
          window.data_editor_state.editor_controls.radix,
          window.data_editor_state.editor_controls.bytes_per_row
        )
      window.data_editor_state.editor_elements.logical.innerHTML =
        logicalDisplay(
          data,
          window.data_editor_state.editor_controls.bytes_per_row
        )
      window.data_editor_state.editor_metrics.row_count = Math.ceil(
        window.data_editor_state.file!.size /
          window.data_editor_state.editor_controls.bytes_per_row
      )
      window.data_editor_state.editor_elements.file_metrics_vw.hidden = false
    })
  }
}

function readFile(file: File): Promise<ArrayBuffer> {
  return new Response(file).arrayBuffer()
}

function syncScroll(from: HTMLElement, to: HTMLElement) {
  // Scroll the "to" by the same percentage as the "from"
  const sf = from.scrollHeight - from.clientHeight
  if (sf >= 1) {
    const st = to.scrollHeight - to.clientHeight
    to.scrollTop = (st / 100) * ((from.scrollTop / sf) * 100)
  }
}

function refreshEditor() {
  try {
    window.data_editor_state.editor_elements.editor.value = Buffer.from(
      window.data_editor_state.edit_content
    ).toString(window.data_editor_state.editor_controls.edit_encoding)
  } catch (e) {
    console.error(
      'decoding into ' +
        window.data_editor_state.editor_controls.edit_encoding +
        ' failed: ' +
        e
    )
    window.data_editor_state.editor_elements.editor.value =
      new TextDecoder().decode(window.data_editor_state.edit_content)
  }
  console.log(
    'compare: ' +
      Buffer.compare(
        Buffer.from(
          window.data_editor_state.editor_elements.editor.value,
          window.data_editor_state.editor_controls.edit_encoding
        ),
        new Uint8Array(window.data_editor_state.edit_content)
      )
  )
}

function selectEditEncoding(editEncoding: string) {
  window.data_editor_state.editor_controls.edit_encoding =
    editEncoding as BufferEncoding
  refreshEditor()
  window.data_editor_state.editor_elements.editor.selectionStart =
    window.data_editor_state.editor_elements.editor.selectionEnd = 0
  storeCursorPos()
  window.data_editor_state.editor_elements.editor.focus()
}

function selectAddressType(addressType: number) {
  window.data_editor_state.editor_controls.address_numbering = addressType
  if (
    window.data_editor_state.editor_controls.address_numbering === 2 &&
    !window.data_editor_state.editor_elements.data_editor.classList.contains(
      'binary'
    )
  ) {
    window.data_editor_state.editor_controls.radix = 2
    window.data_editor_state.editor_controls.bytes_per_row = 8
    window.data_editor_state.editor_elements.data_editor.classList.add('binary')
    if (window.data_editor_state.file_content) {
      window.data_editor_state.editor_elements.physical.innerHTML =
        encodeForDisplay(
          window.data_editor_state.file_content,
          window.data_editor_state.editor_controls.address_numbering,
          window.data_editor_state.editor_controls.bytes_per_row
        )
    }
    window.data_editor_state.editor_elements.physical_offsets.innerHTML =
      makeOffsetRange(
        window.data_editor_state.editor_controls.address_numbering,
        1
      )
    window.data_editor_state.editor_elements.address.innerHTML =
      makeAddressRange(
        0,
        Math.ceil(
          window.data_editor_state.editor_elements.physical.innerHTML.length /
            window.data_editor_state.editor_elements.physical.innerHTML.indexOf(
              '\n'
            )
        ),
        8,
        10
      )
    window.data_editor_state.editor_elements.logical_offsets.innerHTML =
      makeOffsetRange(window.data_editor_state.editor_controls.radix * -1, 1)
  } else {
    window.data_editor_state.editor_controls.bytes_per_row = 16
    if (
      window.data_editor_state.editor_elements.data_editor.classList.contains(
        'binary'
      )
    ) {
      window.data_editor_state.editor_elements.data_editor.classList.remove(
        'binary'
      )
    }
    if (window.data_editor_state.file_content) {
      window.data_editor_state.editor_elements.physical.innerHTML =
        encodeForDisplay(
          window.data_editor_state.file_content,
          16,
          window.data_editor_state.editor_controls.bytes_per_row
        )
    }
    window.data_editor_state.editor_elements.physical_offsets.innerHTML =
      makeOffsetRange(
        window.data_editor_state.editor_controls.address_numbering,
        2
      )
    window.data_editor_state.editor_elements.address.innerHTML =
      makeAddressRange(
        0,
        Math.ceil(
          window.data_editor_state.editor_elements.physical.innerHTML.length /
            window.data_editor_state.editor_elements.physical.innerHTML.indexOf(
              '\n'
            )
        ),
        16,
        window.data_editor_state.editor_controls.address_numbering
      )
    window.data_editor_state.editor_elements.logical_offsets.innerHTML =
      makeOffsetRange(
        window.data_editor_state.editor_controls.address_numbering,
        1
      )
  }
}

function updateDataView() {
  const offset = window.data_editor_state.editor_controls.editor_cursor_pos
  const data_view = new DataView(window.data_editor_state.edit_content.buffer)
  const little_endian = window.data_editor_state.editor_controls.little_endian
  const radix = window.data_editor_state.editor_controls.radix
  const look_ahead = data_view.byteLength - offset
  window.data_editor_state.editor_elements.data_view_offset.innerHTML = String(
    window.data_editor_state.editor_controls.offset +
      offset +
      ', encoding: ' +
      String(radix)
  )
  if (look_ahead >= 8) {
    window.data_editor_state.editor_elements.int64_dv.value = data_view
      .getBigInt64(offset, little_endian)
      .toString(radix)
    window.data_editor_state.editor_elements.uint64_dv.value = data_view
      .getBigUint64(offset, little_endian)
      .toString(radix)
    window.data_editor_state.editor_elements.float64_dv.value = data_view
      .getFloat64(offset, little_endian)
      .toString(radix)
    window.data_editor_state.editor_elements.int32_dv.value = data_view
      .getInt32(offset, little_endian)
      .toString(radix)
    window.data_editor_state.editor_elements.uint32_dv.value = data_view
      .getUint32(offset, little_endian)
      .toString(radix)
    window.data_editor_state.editor_elements.float32_dv.value = data_view
      .getFloat32(offset, little_endian)
      .toString(radix)
    window.data_editor_state.editor_elements.int16_dv.value = data_view
      .getInt16(offset, little_endian)
      .toString(radix)
    window.data_editor_state.editor_elements.uint16_dv.value = data_view
      .getUint16(offset, little_endian)
      .toString(radix)
    window.data_editor_state.editor_elements.int8_dv.value = data_view
      .getInt8(offset)
      .toString(radix)
    window.data_editor_state.editor_elements.uint8_dv.value = data_view
      .getUint8(offset)
      .toString(radix)
    window.data_editor_state.editor_elements.b8_dv.hidden = false
    window.data_editor_state.editor_elements.b16_dv.hidden = false
    window.data_editor_state.editor_elements.b32_dv.hidden = false
    window.data_editor_state.editor_elements.b64_dv.hidden = false
  } else {
    window.data_editor_state.editor_elements.b64_dv.hidden = true
    window.data_editor_state.editor_elements.int64_dv.value = ''
    window.data_editor_state.editor_elements.uint64_dv.value = ''
    window.data_editor_state.editor_elements.float64_dv.value = ''
    if (look_ahead >= 4) {
      window.data_editor_state.editor_elements.int32_dv.value = data_view
        .getInt32(offset, little_endian)
        .toString(radix)
      window.data_editor_state.editor_elements.uint32_dv.value = data_view
        .getUint32(offset, little_endian)
        .toString(radix)
      window.data_editor_state.editor_elements.float32_dv.value = data_view
        .getFloat32(offset, little_endian)
        .toString(radix)
      window.data_editor_state.editor_elements.int16_dv.value = data_view
        .getInt16(offset, little_endian)
        .toString(radix)
      window.data_editor_state.editor_elements.uint16_dv.value = data_view
        .getUint16(offset, little_endian)
        .toString(radix)
      window.data_editor_state.editor_elements.int8_dv.value = data_view
        .getInt8(offset)
        .toString(radix)
      window.data_editor_state.editor_elements.uint8_dv.value = data_view
        .getUint8(offset)
        .toString(radix)
      window.data_editor_state.editor_elements.b8_dv.hidden = false
      window.data_editor_state.editor_elements.b16_dv.hidden = false
      window.data_editor_state.editor_elements.b32_dv.hidden = false
    } else {
      window.data_editor_state.editor_elements.b64_dv.hidden = true
      window.data_editor_state.editor_elements.b32_dv.hidden = true
      window.data_editor_state.editor_elements.int32_dv.value = ''
      window.data_editor_state.editor_elements.uint32_dv.value = ''
      window.data_editor_state.editor_elements.float32_dv.value = ''
      if (look_ahead >= 2) {
        window.data_editor_state.editor_elements.int16_dv.value = data_view
          .getInt16(offset, little_endian)
          .toString(radix)
        window.data_editor_state.editor_elements.uint16_dv.value = data_view
          .getUint16(offset, little_endian)
          .toString(radix)
        window.data_editor_state.editor_elements.int8_dv.value = data_view
          .getInt8(offset)
          .toString(radix)
        window.data_editor_state.editor_elements.uint8_dv.value = data_view
          .getUint8(offset)
          .toString(radix)
        window.data_editor_state.editor_elements.b8_dv.hidden = false
        window.data_editor_state.editor_elements.b16_dv.hidden = false
      } else {
        window.data_editor_state.editor_elements.b64_dv.hidden = true
        window.data_editor_state.editor_elements.b32_dv.hidden = true
        window.data_editor_state.editor_elements.b16_dv.hidden = true
        window.data_editor_state.editor_elements.int16_dv.value = ''
        window.data_editor_state.editor_elements.uint16_dv.value = ''
        if (look_ahead >= 1) {
          window.data_editor_state.editor_elements.int8_dv.value = data_view
            .getInt8(offset)
            .toString(radix)
          window.data_editor_state.editor_elements.uint8_dv.value = data_view
            .getUint8(offset)
            .toString(radix)
          window.data_editor_state.editor_elements.b8_dv.hidden = false
        } else {
          window.data_editor_state.editor_elements.b64_dv.hidden = true
          window.data_editor_state.editor_elements.b32_dv.hidden = true
          window.data_editor_state.editor_elements.b16_dv.hidden = true
          window.data_editor_state.editor_elements.b8_dv.hidden = true
          window.data_editor_state.editor_elements.int8_dv.value = ''
          window.data_editor_state.editor_elements.uint8_dv.value = ''
        }
      }
    }
  }
}

function handleSelected(selected: HTMLTextAreaElement) {
  let selectionStart = selected.selectionStart as number
  let selectionEnd = selected.selectionEnd as number

  if (selected.id === 'physical') {
    if (window.data_editor_state.editor_controls.radix === 2) {
      selectionStart = selectionStart / 9
      selectionEnd = (selectionEnd - 8) / 9 + 1
    } else {
      selectionStart = selectionStart / 3
      selectionEnd = (selectionEnd - 2) / 3 + 1
    }
  } else {
    selectionStart = selectionStart / 2
    selectionEnd = (selectionEnd + 1) / 2
  }
  window.data_editor_state.editor_elements.data_vw.hidden = false
  window.data_editor_state.editor_controls.editor_cursor_pos = 0
  window.data_editor_state.editor_controls.offset = selectionStart
  window.data_editor_state.editor_controls.length =
    selectionStart - selectionEnd
  window.data_editor_state.edit_content =
    window.data_editor_state.file_content!.slice(selectionStart, selectionEnd)
  window.data_editor_state.editor_elements.editor.scrollTo(0, 0)
  window.data_editor_state.editor_elements.selected_offsets.innerHTML =
    selected.id +
    ': ' +
    selectionStart +
    ' - ' +
    selectionEnd +
    ', length: ' +
    (selectionEnd - selectionStart)
  window.data_editor_state.editor_elements.data_view_offset.innerHTML =
    String(selectionStart)
  window.data_editor_state.editor_elements.editor_offsets.innerHTML = '-'
  try {
    window.data_editor_state.editor_elements.editor.value = Buffer.from(
      window.data_editor_state.edit_content
    ).toString(window.data_editor_state.editor_controls.edit_encoding)
  } catch (e) {
    console.error(
      'decoding into ' +
        window.data_editor_state.editor_controls.edit_encoding +
        ' failed: ' +
        e
    )
    window.data_editor_state.editor_elements.editor.value =
      new TextDecoder().decode(window.data_editor_state.edit_content)
  }
  window.data_editor_state.editor_elements.editor.scrollTo(
    0,
    window.data_editor_state.editor_elements.editor.scrollHeight
  )
  updateDataView()
}

function frameSelected(selected: HTMLTextAreaElement) {
  let selectionStart = selected.selectionStart as number
  let selectionEnd = selected.selectionEnd as number
  if (selectionStart % 2 === 1) {
    ++selectionStart
  }
  if (selectionEnd % 2 === 0) {
    --selectionEnd
  }
  selected.selectionStart = selectionStart
  selected.selectionEnd = selectionEnd
  return selected
}

function frameSelectedOnWhitespace(selected: HTMLTextAreaElement) {
  let selectionStart = selected.selectionStart
  let selectionEnd = selected.selectionEnd

  // Adjust the start to align with the closest beginning of content
  if (selectionStart != undefined && selectionEnd != undefined) {
    if (isWhitespace(selected.value.at(selectionStart))) {
      ++selectionStart
    } else {
      while (
        selectionStart &&
        !isWhitespace(selected.value.at(selectionStart - 1))
      ) {
        --selectionStart
      }
    }
    selected.selectionStart = selectionStart

    // Adjust the end to align with the closest ending of content
    if (isWhitespace(selected.value.at(selectionEnd))) {
      --selectionEnd
    } else {
      while (
        selectionEnd < selected.value.length &&
        !isWhitespace(selected.value.at(selectionEnd + 1))
      ) {
        ++selectionEnd
      }
    }
    selected.selectionEnd =
      selectionEnd < selected.value.length ? selectionEnd + 1 : selectionEnd
  }

  return selected
}

function isWhitespace(c: string | undefined): boolean {
  return c ? ' \t\n\r\v'.indexOf(c) > -1 : false
}

function countAscii(buf: ArrayBuffer): number {
  return new Uint8Array(buf).reduce((a, b) => a + (b < 128 ? 1 : 0), 0)
}

// determine if the given character is undefined for latin-1 (ref: https://en.wikipedia.org/wiki/ISO/IEC_8859-1)
function latin1Undefined(c: string): boolean {
  const char_code = c.charCodeAt(0)
  return char_code < 32 || (char_code > 126 && char_code < 160)
}

function logicalDisplay(bytes: ArrayBuffer, bytes_per_row: number): string {
  const undefinedCharStandIn = '�'
  let result = ''
  if (bytes.byteLength > 0) {
    const data = Buffer.from(bytes).toString('latin1').replaceAll('\n', ' ')
    let i = 0
    while (true) {
      for (let col = 0; i < data.length && col < bytes_per_row; ++col) {
        const c = data.charAt(i++)
        result += (latin1Undefined(c) ? undefinedCharStandIn : c) + ' '
      }
      result = result.slice(0, result.length - 1)
      if (i === data.length) {
        break
      }
      result += '\n'
    }
  }
  return result
}

function radixBytePad(radix: number): number {
  switch (radix) {
    case 2:
      return 8
    case 8:
      return 3
    case 10:
      return 3
    case 16:
      return 2
  }
  return 0
}

function encodeForDisplay(
  arr: Uint8Array,
  radix: number,
  bytes_per_row: number
): string {
  let result = ''
  if (arr.byteLength > 0) {
    const pad = radixBytePad(radix)
    let i = 0
    while (true) {
      for (let col = 0; i < arr.byteLength && col < bytes_per_row; ++col) {
        result += arr[i++].toString(radix).padStart(pad, '0') + ' '
      }
      result = result.slice(0, result.length - 1)
      if (i === arr.byteLength) {
        break
      }
      result += '\n'
    }
  }
  return result
}

function makeAddressRange(
  start: number,
  end: number,
  stride: number,
  radix: number
): string {
  let i = start
  let result = (i * stride).toString(radix)
  for (++i; i < end; ++i) {
    result += '\n' + (i * stride).toString(radix)
  }
  return result
}

function makeOffsetRange(radix: number, spread: number): string {
  return ((radix_: number): string => {
    switch (radix_) {
      // @formatter:off
      case 16:
        return (
          '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0<br/>' +
          '0 1 2 3 4 5 6 7 8 9 A B C D E F '
        )
      case 10:
        return (
          '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1<br/>' +
          '0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 '
        )
      case 8:
        return (
          '0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1<br/>' +
          '0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 '
        )
      case 2:
        return (
          '00000000 00111111 11112222 22222233 33333333 44444444 44555555 55556666<br/>' +
          '01234567 89012345 67890123 45678901 23456789 01234567 89012345 67890123'
        )
      case -2:
        return '0 0 0 0 0 0 0 0<br>' + '0 1 2 3 4 5 6 7'
      // @formatter:on
    }
    return 'unhandled radix'
  })(radix).replaceAll(' ', '&nbsp;'.repeat(spread))
}

function enableAdvanced(enable: boolean) {
  const advanced_elements = document.getElementsByClassName('advanced')
  for (let i = 0; i < advanced_elements.length; ++i) {
    const el = advanced_elements[i] as HTMLElement
    el.hidden = !enable
  }
}

window.onload = () => {
  init()
}
