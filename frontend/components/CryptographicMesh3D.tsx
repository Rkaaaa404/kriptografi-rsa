'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function CryptographicMesh3D() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 320
    const height = container.clientHeight || 320

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 5.2

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Geometric Group
    const group = new THREE.Group()
    scene.add(group)

    // Outer Polyhedron Wireframe (Cryptographic Key Vault Symbol)
    const geometry = new THREE.IcosahedronGeometry(1.8, 1)
    const wireframe = new THREE.WireframeGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x71717a, // Subtle zinc-500
      transparent: true,
      opacity: 0.35,
    })
    const lines = new THREE.LineSegments(wireframe, lineMaterial)
    group.add(lines)

    // Inner Core (Small Rotating Polyhedron)
    const innerGeometry = new THREE.OctahedronGeometry(0.9, 0)
    const innerWireframe = new THREE.WireframeGeometry(innerGeometry)
    const innerMaterial = new THREE.LineBasicMaterial({
      color: 0x18181b, // Deep zinc-900
      transparent: true,
      opacity: 0.7,
    })
    const innerLines = new THREE.LineSegments(innerWireframe, innerMaterial)
    group.add(innerLines)

    // Floating Cryptographic Nodes (Points)
    const nodeCount = 42
    const nodeGeometry = new THREE.BufferGeometry()
    const nodePositions = new Float32Array(nodeCount * 3)

    for (let i = 0; i < nodeCount * 3; i += 3) {
      const radius = 1.8 + (Math.random() - 0.5) * 0.4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      nodePositions[i] = radius * Math.sin(phi) * Math.cos(theta)
      nodePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
      nodePositions[i + 2] = radius * Math.cos(phi)
    }

    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
    const nodeMaterial = new THREE.PointsMaterial({
      color: 0x18181b,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    })
    const nodes = new THREE.Points(nodeGeometry, nodeMaterial)
    group.add(nodes)

    // Mouse movement interaction
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      targetX = x * 0.8
      targetY = y * 0.8
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation Loop
    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth mouse easing
      mouseX += (targetX - mouseX) * 0.05
      mouseY += (targetY - mouseY) * 0.05

      group.rotation.x += 0.003 + mouseY * 0.02
      group.rotation.y += 0.004 + mouseX * 0.02

      innerLines.rotation.x -= 0.005
      innerLines.rotation.y -= 0.005

      renderer.render(scene, camera)
    }

    animate()

    // Resize Observer
    const handleResize = () => {
      if (!container) return
      const newW = container.clientWidth
      const newH = container.clientHeight
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-64 sm:h-80 md:h-96 relative flex items-center justify-center pointer-events-none select-none"
    />
  )
}
