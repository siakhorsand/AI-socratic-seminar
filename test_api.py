#!/usr/bin/env python3
import requests
import json
import time
import sys

API_BASE = "http://localhost:8001"

def test_get_agents():
    """Test retrieving the list of available agents."""
    print("Testing GET /api/agents...")
    response = requests.get(f"{API_BASE}/api/agents")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully retrieved {sum(len(category['agents']) for category in data)} agents in {len(data)} categories")
        
        # Print the first agent from each category
        for category in data:
            if category['agents']:
                first_agent = category['agents'][0]
                print(f"  Category: {category['category']}, First Agent: {first_agent['name']}")
        
        return data
    else:
        print(f"❌ Failed to retrieve agents: {response.status_code}")
        print(response.text)
        return None

def test_create_seminar(agent_ids):
    """Test creating a new seminar with the specified agents."""
    print("\nTesting POST /seminar...")
    
    request_data = {
        "question": "What is the most important invention in human history?",
        "agent_ids": agent_ids
    }
    
    print(f"Question: {request_data['question']}")
    print(f"Agents: {', '.join(agent_ids)}")
    
    response = requests.post(f"{API_BASE}/seminar", json=request_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully created seminar with {len(data['answers'])} responses")
        print(f"Conversation ID: {data['conversation_id']}")
        
        # Print a short preview of each response
        for answer in data['answers']:
            preview = answer['response'][:100] + "..." if len(answer['response']) > 100 else answer['response']
            print(f"  {answer['agent']}: {preview}")
        
        return data
    else:
        print(f"❌ Failed to create seminar: {response.status_code}")
        print(response.text)
        return None

def test_continue_conversation(conversation_id, agent_ids):
    """Test continuing an existing conversation."""
    print("\nTesting POST /continue...")
    
    request_data = {
        "conversation_id": conversation_id,
        "question": "How has this invention changed society?",
        "agent_ids": agent_ids
    }
    
    print(f"Follow-up Question: {request_data['question']}")
    
    response = requests.post(f"{API_BASE}/continue", json=request_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully continued conversation with {len(data['answers'])} responses")
        
        # Print a short preview of each response
        for answer in data['answers']:
            preview = answer['response'][:100] + "..." if len(answer['response']) > 100 else answer['response']
            print(f"  {answer['agent']}: {preview}")
        
        return data
    else:
        print(f"❌ Failed to continue conversation: {response.status_code}")
        print(response.text)
        return None

def test_configuration(agent_id):
    """Test configuring an agent."""
    print("\nTesting POST /agent/configure...")
    
    request_data = {
        "agent_id": agent_id,
        "parameters": {
            "temperature": 0.9,
            "persona_strength": 1.5
        }
    }
    
    print(f"Configuring agent: {agent_id}")
    print(f"Parameters: {json.dumps(request_data['parameters'])}")
    
    response = requests.post(f"{API_BASE}/agent/configure", json=request_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully configured agent {agent_id}")
        print(f"Response: {json.dumps(data)}")
        return data
    else:
        print(f"❌ Failed to configure agent: {response.status_code}")
        print(response.text)
        return None

def test_delete_conversation(conversation_id):
    """Test deleting a conversation."""
    print("\nTesting DELETE /conversation/{conversation_id}...")
    
    response = requests.delete(f"{API_BASE}/conversation/{conversation_id}")
    
    if response.status_code == 200:
        print(f"✅ Successfully deleted conversation {conversation_id}")
        return True
    else:
        print(f"❌ Failed to delete conversation: {response.status_code}")
        print(response.text)
        return False

def main():
    print("🧪 Starting API Tests")
    print("=====================")
    
    # Test 1: Retrieve agents
    agents_data = test_get_agents()
    if not agents_data:
        print("❌ Initial test failed, aborting.")
        return
    
    # Extract a few agent IDs for testing
    agent_ids = []
    for category in agents_data:
        if category['agents']:
            agent_ids.append(category['agents'][0]['id'])
            if len(agent_ids) >= 3:
                break
    
    if len(agent_ids) < 2:
        print("❌ Not enough agents available for testing, aborting.")
        return
    
    # Test 2: Create a seminar
    seminar_data = test_create_seminar(agent_ids[:2])
    if not seminar_data:
        print("❌ Seminar creation failed, aborting.")
        return
    
    conversation_id = seminar_data['conversation_id']
    
    # Wait a moment to allow the backend to process
    time.sleep(1)
    
    # Test 3: Continue the conversation
    continue_data = test_continue_conversation(conversation_id, agent_ids[:2])
    if not continue_data:
        print("❌ Conversation continuation failed, aborting.")
        return
    
    # Test 4: Configure an agent
    config_data = test_configuration(agent_ids[0])
    
    # Test 5: Delete the conversation
    delete_success = test_delete_conversation(conversation_id)
    
    # Summary
    print("\n📊 Test Summary")
    print("==============")
    print(f"Get Agents: {'✅' if agents_data else '❌'}")
    print(f"Create Seminar: {'✅' if seminar_data else '❌'}")
    print(f"Continue Conversation: {'✅' if continue_data else '❌'}")
    print(f"Configure Agent: {'✅' if config_data else '❌'}")
    print(f"Delete Conversation: {'✅' if delete_success else '❌'}")
    
    if all([agents_data, seminar_data, continue_data, delete_success]):
        print("\n🎉 All tests passed successfully!")
    else:
        print("\n⚠️ Some tests failed. Please check the logs above.")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Backend server appears to be offline.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        sys.exit(1) 