'use strict';

module.exports = {
  prompt: async input => ({ type: 'prompt', nodeId: input.node.id }),
  command: async input => ({ type: 'command', nodeId: input.node.id }),
  loop: async input => ({ type: 'loop', nodeId: input.node.id }),
  bash: async input => {
    if (input.node.id === 'backend') {
      throw new Error('backend failed');
    }
    return { type: 'bash', nodeId: input.node.id };
  },
};
