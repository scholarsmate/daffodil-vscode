"use strict";

export {};

declare global {
    interface Window {
        data_editor_state: EditorState
    }
}

interface EditorControls {
    bytes_per_line: number
    address_numbering: number
    radix: number
    bytes_in_group: number
    little_endian: boolean
    capitalize_radix: boolean
    logical_encoding: string
    offset: number
    length: number
    edit_byte_size: number
    edit_encoding: string
    lsb_higher_offset: boolean
    bytes_per_row: number
    editor_cursor_pos: number
}

interface EditorMetrics {
    change_count: number
    data_breakpoint_count: number
    file_byte_count: number
    ascii_byte_count: number
}

interface EditorElements {
    data_editor: HTMLElement
    address: HTMLElement
    physical: HTMLInputElement
    logical: HTMLInputElement
    editor: HTMLTextAreaElement
    physical_offsets: HTMLElement
    logical_offsets: HTMLElement
    selected_offsets: HTMLElement
    editor_offsets: HTMLElement
    commit_button: HTMLInputElement
    add_data_breakpoint_button: HTMLInputElement
    change_count: HTMLElement
    data_breakpoint_count: HTMLElement
    file_byte_count: HTMLElement
    ascii_byte_count: HTMLElement
    cursor_pos: HTMLElement
}

interface EditorState {
    file: File | null
    file_content: ArrayBuffer | null
    edit_content: ArrayBuffer | null
    edit_content_crc: number
    crc_table: ArrayBuffer
    editor_controls: EditorControls
    editor_metrics: EditorMetrics
    editor_elements: EditorElements
}

function handleEditorChange(editor: HTMLTextAreaElement) {
    console.log(editor)
    window.data_editor_state.editor_elements.editor_offsets.innerHTML = "start: " + String(editor.selectionStart + ", end: " + String(editor.selectionEnd))
}

function init() {
    window.data_editor_state = {
        file: null,
        file_content: null,
        edit_content: null,
        edit_content_crc: 0,
        crc_table: makeCRCTable(),
        editor_controls: {
            bytes_per_line: 8,         // [6, 8]
            address_numbering: 10,     // [2, 8, 10, 16] | "none"
            radix: 16,                 // [2, 8, 10, 16]
            bytes_in_group: 2,         // [1, 2, 4, 8]
            little_endian: true,       // true | false
            capitalize_radix: true,    // true | false
            logical_encoding: "ascii", // "ascii" | "ebcidic" | "utf-8" | "none"
            offset: 0,                 // number
            length: 0,                 // number
            edit_byte_size: 8,         // [6, 7, 8]
            edit_encoding: "ascii",    // [2, 8, 10, 16 ] | "ascii" | "ebcidic" | "utf-8" | "utf-16"
            lsb_higher_offset: true,   // true | false
            bytes_per_row: 16,
            editor_cursor_pos: 0,
        },
        editor_elements: {
            data_editor: document.getElementById("data_editor") as HTMLInputElement,
            address: document.getElementById("address") as HTMLElement,
            physical: document.getElementById("physical") as HTMLInputElement,
            logical: document.getElementById("logical") as HTMLInputElement,
            editor: document.getElementById("editor") as HTMLTextAreaElement,
            physical_offsets: document.getElementById("physical_offsets") as HTMLInputElement,
            logical_offsets: document.getElementById("logical_offsets") as HTMLInputElement,
            selected_offsets: document.getElementById("selected_offsets") as HTMLElement,
            editor_offsets: document.getElementById("editor_offsets") as HTMLElement,
            file_byte_count: document.getElementById("file_byte_cnt") as HTMLElement,
            change_count: document.getElementById("change_cnt") as HTMLElement,
            data_breakpoint_count: document.getElementById("data_breakpoint_cnt") as HTMLElement,
            ascii_byte_count: document.getElementById("ascii_byte_cnt") as HTMLElement,
            commit_button: document.getElementById("commit_btn") as HTMLInputElement,
            add_data_breakpoint_button: document.getElementById("add_data_breakpoint_btn") as HTMLInputElement,
            cursor_pos: document.getElementById("cursor_pos") as HTMLElement,
        },
        editor_metrics: {
            change_count: 0,
            data_breakpoint_count: 0,
            file_byte_count: 0,
            ascii_byte_count: 0,
        }
    }

    // add listeners
    window.data_editor_state.editor_elements.physical.addEventListener("select", () => handleSelected(frameSelectedOnWhitespace(window.data_editor_state.editor_elements.physical)))
    window.data_editor_state.editor_elements.logical.addEventListener("select", () => handleSelected(frameSelected(window.data_editor_state.editor_elements.logical)))

    window.data_editor_state.editor_elements.editor.addEventListener("select", () => handleEditorChange(window.data_editor_state.editor_elements.editor))

    const address_type = document.getElementById("address_numbering") as HTMLInputElement
    address_type.addEventListener("change", () => selectAddressType(parseInt(address_type.value)))

    const edit_encoding = document.getElementById("edit_encoding") as HTMLInputElement
    window.data_editor_state.editor_controls.edit_encoding = edit_encoding.value
    edit_encoding.addEventListener("change", () => selectEditEncoding(edit_encoding.value))

    const file_input = document.getElementById("file_input") as HTMLInputElement
    file_input.addEventListener("change", () => loadContent(file_input.files))

    const bytes_in_group = document.getElementById("bytes_in_group") as HTMLInputElement
    bytes_in_group.addEventListener("change", () => selectBytesInGroup(parseInt(bytes_in_group.value)))

    const endianness = document.getElementById("endianness") as HTMLInputElement
    endianness.addEventListener("change", () => selectEndianness(endianness.value))

    const storeCaretPos = () => {
        window.data_editor_state.editor_controls.editor_cursor_pos = window.data_editor_state.editor_elements.editor.selectionStart
        window.data_editor_state.editor_elements.cursor_pos.innerHTML = " Cursor Pos: " + String(window.data_editor_state.editor_controls.editor_cursor_pos)
    }
    window.data_editor_state.editor_elements.editor.oninput = window.data_editor_state.editor_elements.editor.onclick = window.data_editor_state.editor_elements.editor.oncontextmenu = storeCaretPos
    window.data_editor_state.editor_elements.editor.onkeyup = ({key}) => {
        console.log("key: " + key)
        if (['Arrow', 'Page', 'Home', 'End'].some(type => key.startsWith(type))) {
            storeCaretPos()
        }
    }

    let currentScrollEvt, scrollSyncTimer;
    window.data_editor_state.editor_elements.physical.onscroll = () => {
        if (!currentScrollEvt || currentScrollEvt === "physical") {
            clearTimeout(scrollSyncTimer);
            currentScrollEvt = "physical";
            syncScroll(window.data_editor_state.editor_elements.physical, window.data_editor_state.editor_elements.address);
            syncScroll(window.data_editor_state.editor_elements.physical, window.data_editor_state.editor_elements.logical);
            scrollSyncTimer = setTimeout(function () {
                currentScrollEvt = null;
            }, 100);
        }
    };
    window.data_editor_state.editor_elements.address.onscroll = () => {
        if (!currentScrollEvt || currentScrollEvt === "address") {
            clearTimeout(scrollSyncTimer);
            currentScrollEvt = "address";
            syncScroll(window.data_editor_state.editor_elements.address, window.data_editor_state.editor_elements.physical);
            syncScroll(window.data_editor_state.editor_elements.address, window.data_editor_state.editor_elements.logical);
            scrollSyncTimer = setTimeout(function () {
                currentScrollEvt = null;
            }, 100);
        }
    };
    window.data_editor_state.editor_elements.logical.onscroll = () => {
        if (!currentScrollEvt || currentScrollEvt === "logical") {
            clearTimeout(scrollSyncTimer);
            currentScrollEvt = "logical";
            syncScroll(window.data_editor_state.editor_elements.logical, window.data_editor_state.editor_elements.address);
            syncScroll(window.data_editor_state.editor_elements.logical, window.data_editor_state.editor_elements.physical);
            scrollSyncTimer = setTimeout(function () {
                currentScrollEvt = null;
            }, 100);
        }
    };

}

function selectEndianness(endianness: string) {
    window.data_editor_state.editor_controls.little_endian = (endianness == "le")
}

function selectBytesInGroup(bytes_in_group: number) {
    window.data_editor_state.editor_controls.bytes_in_group = bytes_in_group
    // TODO: Redraw the physical view
}

function loadContent(files: FileList | null) {
    if (files) {
        const file: File = files[0]
        window.data_editor_state.editor_elements.editor.value = ""
        window.data_editor_state.editor_elements.commit_button.disabled = false
        window.data_editor_state.editor_elements.add_data_breakpoint_button.disabled = false
        window.data_editor_state.editor_metrics.file_byte_count = file.size
        window.data_editor_state.editor_elements.logical_offsets.innerHTML = makeOffsetRange(10, 1)
        window.data_editor_state.editor_elements.physical_offsets.innerHTML = makeOffsetRange(10, 2)
        window.data_editor_state.editor_elements.address.innerHTML = makeAddressRange(0, Math.ceil(file.size / 16), 16, 10)
        window.data_editor_state.editor_elements.file_byte_count.innerHTML = String(window.data_editor_state.editor_metrics.file_byte_count)
        readFile(file).then(data => {
            window.data_editor_state.file_content = data
            window.data_editor_state.editor_metrics.ascii_byte_count = countAscii(data)
            window.data_editor_state.editor_elements.ascii_byte_count.innerHTML = String(window.data_editor_state.editor_metrics.ascii_byte_count)
            window.data_editor_state.editor_elements.physical.innerHTML = encodeHex(data, window.data_editor_state.editor_controls.bytes_per_row)
            window.data_editor_state.editor_elements.logical.innerHTML = logicalDisplay(data, window.data_editor_state.editor_controls.bytes_per_row)
        });
    }
}

function readFile(file: File): Promise<ArrayBuffer> {
    return new Response(file).arrayBuffer()
}

function syncScroll(from, to) {
    // Scroll the "to" by the same percentage as the "from"
    const sf = from.scrollHeight - from.clientHeight;
    if (sf >= 1) {
        const st = to.scrollHeight - to.clientHeight;
        to.scrollTop = (st / 100) * (from.scrollTop / sf * 100);
    }
}

function refreshEditor() {
    // TODO: Convert this data back to its physical form
    //const content = new TextEncoder().encode(window.data_editor_state.editor_elements.editor.value)
    const content = str2ab(window.data_editor_state.editor_elements.editor.value)
    console.log(content)
    console.log("encoding: " + window.data_editor_state.editor_controls.edit_encoding)
    try {
        const fresh_content = new TextDecoder(window.data_editor_state.editor_controls.edit_encoding).decode(content)
        window.data_editor_state.editor_elements.editor.value = fresh_content
        console.log(fresh_content)
    } catch (e) {
        console.log(e)
        window.data_editor_state.editor_elements.editor.value = new TextDecoder().decode(content)
    }
    window.data_editor_state.editor_elements.editor.scrollTo(0, window.data_editor_state.editor_elements.editor.scrollHeight)
}

function selectEditEncoding(editEncoding: string) {
    window.data_editor_state.editor_controls.edit_encoding = editEncoding
    refreshEditor()
}

function str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0; i < str.length; ++i) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function selectAddressType(addressType: number) {
    window.data_editor_state.editor_controls.radix = addressType
    if (window.data_editor_state.editor_controls.radix === 2 && !window.data_editor_state.editor_elements.data_editor.classList.contains("binary")) {
        window.data_editor_state.editor_controls.bytes_per_row = 8
        window.data_editor_state.editor_elements.data_editor.classList.add("binary")
        if (window.data_editor_state.file_content) {
            window.data_editor_state.editor_elements.physical.innerHTML = encodeBinary(window.data_editor_state.file_content, window.data_editor_state.editor_controls.bytes_per_row)
        }
        window.data_editor_state.editor_elements.physical_offsets.innerHTML = makeOffsetRange(window.data_editor_state.editor_controls.radix, 1)
        window.data_editor_state.editor_elements.address.innerHTML = makeAddressRange(0, Math.ceil(window.data_editor_state.editor_elements.physical.innerHTML.length / window.data_editor_state.editor_elements.physical.innerHTML.indexOf("\n")), 8, 10)
        window.data_editor_state.editor_elements.logical_offsets.innerHTML = makeOffsetRange(window.data_editor_state.editor_controls.radix * -1, 1)
    } else {
        window.data_editor_state.editor_controls.bytes_per_row = 16
        if (window.data_editor_state.editor_elements.data_editor.classList.contains("binary")) {
            window.data_editor_state.editor_elements.data_editor.classList.remove("binary")
        }
        if (window.data_editor_state.file_content) {
            window.data_editor_state.editor_elements.physical.innerHTML = encodeHex(window.data_editor_state.file_content, window.data_editor_state.editor_controls.bytes_per_row)
        }
        window.data_editor_state.editor_elements.physical_offsets.innerHTML = makeOffsetRange(window.data_editor_state.editor_controls.radix, 2)
        window.data_editor_state.editor_elements.address.innerHTML = makeAddressRange(0, Math.ceil(window.data_editor_state.editor_elements.physical.innerHTML.length / window.data_editor_state.editor_elements.physical.innerHTML.indexOf("\n")), 16, window.data_editor_state.editor_controls.radix)
        window.data_editor_state.editor_elements.logical_offsets.innerHTML = makeOffsetRange(window.data_editor_state.editor_controls.radix, 1)
    }
}

function handleSelected(selected) {
    let selectionStart = selected.selectionStart
    let selectionEnd = selected.selectionEnd

    if (selected.id === "physical") {
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
    window.data_editor_state.edit_content = window.data_editor_state.file_content!.slice(selectionStart, selectionEnd)
    window.data_editor_state.edit_content_crc = crc32(window.data_editor_state.edit_content)
    window.data_editor_state.editor_elements.editor.scrollTo(0, 0)
    window.data_editor_state.editor_elements.selected_offsets.innerHTML = selected.id + ": " + selectionStart + " - " + selectionEnd + ", length: " + (selectionEnd - selectionStart) + ", CRC-32: " + String(window.data_editor_state.edit_content_crc)
    try {
        console.log("encoding: " + window.data_editor_state.editor_controls.edit_encoding)
        console.log(window.data_editor_state.edit_content)
        window.data_editor_state.editor_elements.editor.value = new TextDecoder(window.data_editor_state.editor_controls.edit_encoding).decode(window.data_editor_state.edit_content)
    } catch (e) {
        console.log(e)
        window.data_editor_state.editor_elements.editor.value = new TextDecoder().decode(window.data_editor_state.edit_content)
    }
    window.data_editor_state.editor_elements.editor.scrollTo(0, window.data_editor_state.editor_elements.editor.scrollHeight)
}

function frameSelected(selected) {
    if (selected.selectionStart % 2 === 1) {
        ++selected.selectionStart
    }
    if (selected.selectionEnd % 2 === 0) {
        --selected.selectionEnd
    }
    return selected
}

function frameSelectedOnWhitespace(selected: HTMLInputElement) {
    let selectionStart = selected.selectionStart
    let selectionEnd = selected.selectionEnd

    // Adjust the start to align with the closest beginning of content
    if (selectionStart != undefined && selectionEnd != undefined) {
        if (isWhitespace(selected.value.at(selectionStart))) {
            ++selectionStart;
        } else {
            while (selectionStart && !isWhitespace(selected.value.at(selectionStart - 1))) {
                --selectionStart;
            }
        }
        selected.selectionStart = selectionStart;

        // Adjust the end to align with the closest ending of content
        if (isWhitespace(selected.value.at(selectionEnd))) {
            --selectionEnd;
        } else {
            while (selectionEnd < selected.value.length && !isWhitespace(selected.value.at(selectionEnd + 1))) {
                ++selectionEnd
            }
        }
        selected.selectionEnd = (selectionEnd < selected.value.length) ? selectionEnd + 1 : selectionEnd
    }

    return selected
}

function isWhitespace(c: string | undefined): boolean {
    return (c) ? (' \t\n\r\v'.indexOf(c) > -1) : false
}

/*
function characterByteCount(c: string): number {
    return new TextEncoder().encode(c).length
}
*/

function ab2str(buf: ArrayBuffer): string {
    // TODO: use map here
    const view = new Uint8Array(buf)
    let result = ""
    for (let i = 0; i < buf.byteLength; ++i) {
        result += String.fromCharCode(view[i])
    }
    return result
}

function countAscii(buf: ArrayBuffer): number {
    let result = 0;
    // TODO: use reduce
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    for (let i = 0; i < len; ++i) {
        if (bytes[i] < 128) {
            ++result;
        }
    }
    return result;
}

function logicalDisplay(bytes: ArrayBuffer, bytes_per_row: number): string {
    let result = "";
    if (bytes.byteLength > 0) {
        const data = ab2str(bytes).replaceAll("\n", " ")
        let i = 0
        while (true) {
            for (let col = 0; i < data.length && col < bytes_per_row; ++col) {
                result += data.charAt(i++) + " "
            }
            result = result.slice(0, result.length - 1);
            if (i === data.length) {
                break;
            }
            result += "\n";
        }
    }
    return result
}

function encodeHex(buf: ArrayBuffer, bytes_per_row: number): string {
    let result = ""
    if (buf.byteLength > 0) {
        const bytes = new Uint8Array(buf)
        let i = 0
        while (true) {
            for (let col = 0; i < bytes.byteLength && col < bytes_per_row; ++col) {
                result += bytes[i++].toString(16).toUpperCase().padStart(2, "0") + " ";
            }
            result = result.slice(0, result.length - 1);
            if (i === bytes.byteLength) {
                break;
            }
            result += "\n";
        }
    }
    return result;
}

function encodeBinary(buf: ArrayBuffer, bytes_per_row: number): string {
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    let result = "";
    let i = 0;
    while (true) {
        for (let j = 0; i < len && j < bytes_per_row; ++j) {
            result += bytes[i++].toString(2).toUpperCase().padStart(8, "0") + " ";
        }
        result = result.slice(0, result.length - 1);
        if (i === len) {
            break;
        }
        result += "\n";
    }
    return result;
}

function makeAddressRange(start: number, end: number, stride: number, radix: number): string {
    let i = start;
    let result = (i * stride).toString(radix);
    for (++i; i < end; ++i) {
        result += "\n" + (i * stride).toString(radix);
    }
    return result;
}

function makeOffsetRange(radix: number, spread: number): string {
    return ((radix_: number): string => {
        switch (radix_) {
            // @formatter:off
            case 16:
                return "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0<br/>" +
                    "0 1 2 3 4 5 6 7 8 9 A B C D E F "
            case 10:
                return "0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1<br/>" +
                    "0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 "
            case 8:
                return "0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1<br/>" +
                    "0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 "
            case 2:
                return "00000000 00111111 11112222 22222233 33333333 44444444 44555555 55556666<br/>" +
                    "01234567 89012345 67890123 45678901 23456789 01234567 89012345 67890123"
            case -2:
                return "0 0 0 0 0 0 0 0<br>" +
                    "0 1 2 3 4 5 6 7"
            // @formatter:on
        }
        return "unhandled radix"
    })(radix).replaceAll(" ", "&nbsp;".repeat(spread))
}

function makeCRCTable(): ArrayBuffer {
    let c: number;
    const crcTable = new ArrayBuffer(256);
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

function crc32(buf: ArrayBuffer | undefined): number {
    let crc = 0 ^ (-1)
    if (buf && buf.byteLength > 0) {
        for (let i = 0; i < buf.byteLength; i++) {
            crc = (crc >>> 8) ^ window.data_editor_state.crc_table[(crc ^ buf[i]) & 0xFF]
        }
    }
    return (crc ^ (-1)) >>> 0
}

window.onload = () => {
    init()
}
