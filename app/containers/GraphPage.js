import React, { Component } from 'react';
import GraphView from 'react-digraph';

const GraphConfig = {
  NodeTypes: {
    empty: {
      typeText: 'None',
      shapeId: '#empty',
      shape: (
        <symbol viewBox="0 0 100 100" id="empty" key="0">
          <circle cx="50" cy="50" r="45" />
        </symbol>
      )
    }
  },
  NodeSubtypes: {},
  EdgeTypes: {
    emptyEdge: {
      shapeId: '#emptyEdge',
      shape: (
        <symbol viewBox="0 0 50 50" id="emptyEdge" key="0">
          <circle cx="25" cy="25" r="8" fill="currentColor" />
        </symbol>
      )
    }
  }
};

const sample = {
  nodes: [
    {
      id: 1,
      title: 'Node A',
      x: 258.3976135253906,
      y: 331.9783248901367,
      type: 'empty'
    },
    {
      id: 2,
      title: 'Node B',
      x: 593.9393920898438,
      y: 260.6060791015625,
      type: 'empty'
    },
    {
      id: 3,
      title: 'Node C',
      x: 237.5757598876953,
      y: 61.81818389892578,
      type: 'empty'
    },
    {
      id: 4,
      title: 'Node C',
      x: 600.5757598876953,
      y: 600.81818389892578,
      type: 'empty'
    }
  ],
  edges: [
    {
      source: 1,
      target: 2,
      type: 'emptyEdge'
    },
    {
      source: 2,
      target: 4,
      type: 'emptyEdge'
    }
  ]
};

const EMPTY_TYPE = 'empty';  // Text on empty nodes is positioned differently
const NODE_KEY = 'id';       // Allows D3 to correctly update DOM

export default class Graph extends Component {

  constructor(props) {
    super(props);

    this.state = {
      graph: sample,
      selected: {}
    };

    this.getViewNode = this.getViewNode.bind(this);
    this.onSelectNode = this.onSelectNode.bind(this);
    this.onCreateNode = this.onCreateNode.bind(this);
    this.onUpdateNode = this.onUpdateNode.bind(this);
    this.onDeleteNode = this.onDeleteNode.bind(this);
    this.onSelectEdge = this.onSelectEdge.bind(this);
    this.onCreateEdge = this.onCreateEdge.bind(this);
    this.onSwapEdge = this.onSwapEdge.bind(this);
    this.onDeleteEdge = this.onDeleteEdge.bind(this);
  }

  // Helper to find the index of a given node
  getNodeIndex(searchNode) {
    return this.state.graph.nodes.findIndex((node) => node[NODE_KEY] === searchNode[NODE_KEY]);
  }

  // Helper to find the index of a given edge
  getEdgeIndex(searchEdge) {
    return this.state.graph.edges.findIndex((edge) => edge.source === searchEdge.source &&
        edge.target === searchEdge.target);
  }

  // Given a nodeKey, return the corresponding node
  getViewNode(nodeKey) {
    const searchNode = {};
    searchNode[NODE_KEY] = nodeKey;
    const i = this.getNodeIndex(searchNode);
    return this.state.graph.nodes[i];
  }

  /*
   * Handlers/Interaction
   */

  // Called by 'drag' handler, etc..
  // to sync updates from D3 with the graph
  onUpdateNode(viewNode) {
    const graph = this.state.graph;
    const i = this.getNodeIndex(viewNode);

    graph.nodes[i] = viewNode;
    this.setState({ graph });
  }

  // Node 'mouseUp' handler
  onSelectNode(viewNode) {
    // Deselect events will send Null viewNode
    if (viewNode) {
      this.setState({ selected: viewNode });
    } else {
      this.setState({ selected: {} });
    }
  }

  // Edge 'mouseUp' handler
  onSelectEdge(viewEdge) {
    this.setState({ selected: viewEdge });
  }

  // Updates the graph with a new node
  onCreateNode(x, y) {
    const graph = this.state.graph;

    // This is just an example - any sort of logic
    // could be used here to determine node type
    // There is also support for subtypes. (see 'sample' above)
    // The subtype geometry will underlay the 'type' geometry for a node
    const type = Math.random() < 0.25 ? SPECIAL_TYPE : EMPTY_TYPE;

    const viewNode = {
      id: this.state.graph.nodes.length + 1,
      title: '',
      type,
      x,
      y
    };

    graph.nodes.push(viewNode);
    this.setState({ graph });
  }

  // Deletes a node from the graph
  onDeleteNode(viewNode) {
    const graph = this.state.graph;
    const i = this.getNodeIndex(viewNode);
    graph.nodes.splice(i, 1);

    // Delete any connected edges
    const newEdges = graph.edges.filter((edge, i) => edge.source != viewNode[NODE_KEY] &&
              edge.target != viewNode[NODE_KEY]);

    graph.edges = newEdges;

    this.setState({ graph, selected: {} });
  }

  // Creates a new node between two edges
  onCreateEdge(sourceViewNode, targetViewNode) {
    const graph = this.state.graph;

    // This is just an example - any sort of logic
    // could be used here to determine edge type
    const type = sourceViewNode.type === SPECIAL_TYPE ? SPECIAL_EDGE_TYPE : EMPTY_EDGE_TYPE;

    const viewEdge = {
      source: sourceViewNode[NODE_KEY],
      target: targetViewNode[NODE_KEY],
      type
    };
    graph.edges.push(viewEdge);
    this.setState({ graph });
  }

  // Called when an edge is reattached to a different target.
  onSwapEdge(sourceViewNode, targetViewNode, viewEdge) {
    const graph = this.state.graph;
    const i = this.getEdgeIndex(viewEdge);
    const edge = JSON.parse(JSON.stringify(graph.edges[i]));

    edge.source = sourceViewNode[NODE_KEY];
    edge.target = targetViewNode[NODE_KEY];
    graph.edges[i] = edge;

    this.setState({ graph });
  }

  // Called when an edge is deleted
  onDeleteEdge(viewEdge) {
    const graph = this.state.graph;
    const i = this.getEdgeIndex(viewEdge);
    graph.edges.splice(i, 1);
    this.setState({ graph, selected: {} });
  }

  /* Define custom graph editing methods here */

  render() {
    const nodes = this.state.graph.nodes;
    const edges = this.state.graph.edges;
    const selected = this.state.selected;

    const NodeTypes = GraphConfig.NodeTypes;
    const NodeSubtypes = GraphConfig.NodeSubtypes;
    const EdgeTypes = GraphConfig.EdgeTypes;

    const style = {
      height: '100%',
      width: '100%'
    };

    return (
      <div
        id="graph"
        style={style}
      >
        <GraphView
          ref="GraphView"
          nodeKey={NODE_KEY}
          emptyType={EMPTY_TYPE}
          nodes={nodes}
          edges={edges}
          selected={selected}
          nodeTypes={NodeTypes}
          nodeSubtypes={NodeSubtypes}
          edgeTypes={EdgeTypes}
          getViewNode={this.getViewNode}
          onSelectNode={this.onSelectNode}
          onCreateNode={this.onCreateNode}
          onUpdateNode={this.onUpdateNode}
          onDeleteNode={this.onDeleteNode}
          onSelectEdge={this.onSelectEdge}
          onCreateEdge={this.onCreateEdge}
          onSwapEdge={this.onSwapEdge}
          onDeleteEdge={this.onDeleteEdge}
        />
      </div>
    );
  }
}
