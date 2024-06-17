import React, { useState, useEffect } from 'react';
import {
  EditorState,
  Editor,
  RichUtils,
  convertToRaw,
  convertFromRaw,
  Modifier,
  getDefaultKeyBinding,
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import './App.css';

function App() {
  const [editorState, setEditorState] = useState(() => {
    const savedContent = localStorage.getItem('draftEditorContent');
    if (savedContent) {
      return EditorState.createWithContent(
        convertFromRaw(JSON.parse(savedContent))
      );
    }
    return EditorState.createEmpty();
  });

  useEffect(() => {
    const contentState = editorState.getCurrentContent();
    localStorage.setItem(
      'draftEditorContent',
      JSON.stringify(convertToRaw(contentState))
    );
  }, [editorState]);

  const clearInlineStyles = (editorState) => {
    const currentStyle = editorState.getCurrentInlineStyle();
    let updatedEditorState = editorState;

    currentStyle.forEach((style) => {
      updatedEditorState = RichUtils.toggleInlineStyle(
        updatedEditorState,
        style
      );
    });

    return updatedEditorState;
  };

  const handleTrigger = (
    newEditorState,
    trigger,
    blockType = null,
    style = null
  ) => {
    const selection = newEditorState.getSelection();
    const content = newEditorState.getCurrentContent();
    const startKey = selection.getStartKey();
    const block = content.getBlockForKey(startKey);
    const blockText = block.getText();
    const startOffset = selection.getStartOffset();
    const endOffset = selection.getEndOffset();

    if (
      blockText.startsWith(trigger) &&
      startOffset === trigger.length &&
      endOffset === trigger.length
    ) {
      const newContentState = Modifier.replaceText(
        content,
        selection.merge({ anchorOffset: 0, focusOffset: trigger.length }),
        '',
        block.getInlineStyleAt(trigger.length)
      );

      let updatedEditorState = EditorState.push(
        newEditorState,
        newContentState,
        'remove-range'
      );

      updatedEditorState = clearInlineStyles(updatedEditorState);

      if (blockType) {
        updatedEditorState = RichUtils.toggleBlockType(
          updatedEditorState,
          blockType
        );
      }

      if (style) {
        updatedEditorState = RichUtils.toggleInlineStyle(
          updatedEditorState,
          style
        );
      }

      setEditorState(updatedEditorState);
      return true;
    }

    return false;
  };

  const onChange = (newEditorState) => {
    const selection = newEditorState.getSelection();
    const content = newEditorState.getCurrentContent();
    const blockText = content.getBlockForKey(selection.getStartKey()).getText();

    if (
      (blockText.startsWith('# ') &&
        handleTrigger(newEditorState, '# ', 'header-one')) ||
      (blockText.startsWith('* ') &&
        handleTrigger(newEditorState, '* ', null, 'BOLD')) ||
      (blockText.startsWith('** ') &&
        handleTrigger(newEditorState, '** ', null, 'RED')) ||
      (blockText.startsWith('*** ') &&
        handleTrigger(newEditorState, '*** ', null, 'UNDERLINE')) ||
      (blockText.startsWith('``` ') &&
        handleTrigger(newEditorState, '``` ', 'code-block', 'CODE'))
    ) {
      return;
    }

    setEditorState(newEditorState);
  };

  const handleSave = () => {
    const contentState = editorState.getCurrentContent();
    localStorage.setItem(
      'draftEditorContent',
      JSON.stringify(convertToRaw(contentState))
    );
    alert('Content saved successfully!');
  };

  const keyBindingFn = (e) => {
    if (e.keyCode === 13 /* `Enter` key */) {
      return 'split-block';
    }
    return getDefaultKeyBinding(e);
  };

  const handleKeyCommand = (command, newEditorState) => {
    if (command === 'split-block') {
      const selection = newEditorState.getSelection();
      const content = newEditorState.getCurrentContent();

      // Split the block and reset inline styles
      const newContentState = Modifier.splitBlock(content, selection);
      const resetEditorState = EditorState.push(
        newEditorState,
        newContentState,
        'split-block'
      );

      setEditorState(resetEditorState);
      return 'handled';
    }
    return 'not-handled';
  };

  const styleMap = {
    BOLD: {
      fontWeight: 'bold',
    },
    RED: {
      color: 'red',
    },
    UNDERLINE: {
      textDecoration: 'underline',
    },
    CODE: {
      backgroundColor: 'yellow',
      color: 'black',
      padding: '0 2px',
    },
  };

  return (
    <div className='app-container'>
      <h1 className='app-title'>React Sorcerer</h1>
      <div className='editor-container'>
        <Editor
          editorState={editorState}
          onChange={onChange}
          customStyleMap={styleMap}
          placeholder='Start typing here...'
          keyBindingFn={keyBindingFn}
          handleKeyCommand={handleKeyCommand}
        />
      </div>
      <button className='save-button' onClick={handleSave}>
        Save
      </button>
    </div>
  );
}

export default App;
